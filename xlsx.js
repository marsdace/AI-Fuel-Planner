// Trail Lab 极简 XLSX 生成器（纯 JS，零依赖）— Web 版
// 移植自 09_wxxcx/utils/xlsx.js（2026-08-28），适配浏览器：str2utf8 用 TextEncoder，
// 导出 window.TrailLabXlsx.buildXlsx。
// 生成标准 .xlsx（ZIP store 不压缩 + OOXML 工作表），支持多 sheet、内嵌 PNG。
// 用法：const ab = TrailLabXlsx.buildXlsx({ sheets: [{ name, rows, colWidths, imageBytes, imageAt }] });
"use strict";

(function (global) {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xffffffff;
    const view = new Uint8Array(buf);
    for (let i = 0; i < view.length; i++) c = CRC_TABLE[(c ^ view[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // ---------- 最小 ZIP（仅 store，不压缩） ----------
  function buildZip(entries) {
    const chunks = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    for (let ei = 0; ei < entries.length; ei++) {
      const entry = entries[ei];
      const nameBytes = str2utf8(entry.name);
      const data = entry.data;
      const crc = crc32(data);
      const size = data.byteLength;
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0, true);
      local.setUint16(8, 0, true);
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, size, true);
      local.setUint32(22, size, true);
      local.setUint16(26, nameBytes.byteLength, true);
      local.setUint16(28, 0, true);
      chunks.push(local.buffer, nameBytes, data);
      const localOffset = offset;
      offset += 30 + nameBytes.byteLength + size;

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true);
      cd.setUint16(8, 0, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, size, true);
      cd.setUint32(24, size, true);
      cd.setUint16(28, nameBytes.byteLength, true);
      cd.setUint16(30, 0, true);
      cd.setUint16(32, 0, true);
      cd.setUint16(34, 0, true);
      cd.setUint16(36, 0, true);
      cd.setUint32(38, 0, true);
      cd.setUint32(42, localOffset, true);
      central.push(cd.buffer, nameBytes);
    }

    const cdStart = offset;
    for (let ci = 0; ci < central.length; ci++) {
      const c = central[ci];
      chunks.push(c);
      offset += c.byteLength;
    }
    const cdSize = offset - cdStart;
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(4, 0, true);
    eocd.setUint16(6, 0, true);
    eocd.setUint16(8, entries.length, true);
    eocd.setUint16(10, entries.length, true);
    eocd.setUint32(12, cdSize, true);
    eocd.setUint32(16, cdStart, true);
    eocd.setUint16(20, 0, true);
    chunks.push(eocd.buffer);

    return concat(chunks);
  }

  function str2utf8(s) {
    const bytes = new TextEncoder().encode(s);
    return bytes.buffer;
  }

  function concat(chunks) {
    let len = 0;
    for (const c of chunks) len += c.byteLength;
    const out = new Uint8Array(len);
    let p = 0;
    for (const c of chunks) {
      out.set(new Uint8Array(c), p);
      p += c.byteLength;
    }
    return out.buffer;
  }

  // ---------- XML 工具 ----------
  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function colName(n) {
    let s = "";
    n += 1;
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  // ---------- 图片尺寸（PNG IHDR） ----------
  function pngSize(bytes) {
    const view = new DataView(bytes);
    if (view.byteLength < 24 || view.getUint32(0) !== 0x89504e47) return { w: 600, h: 260 };
    return { w: view.getUint32(16), h: view.getUint32(20) };
  }

  // ---------- 生成 XLSX ----------
  function buildXlsx(opts) {
    opts = opts || {};
    let sheets = opts.sheets;
    if (!Array.isArray(sheets)) {
      sheets = [{
        name: "补给方案",
        rows: opts.rows || [],
        colWidths: opts.colWidths,
        imageBytes: opts.imageBytes,
        imageAt: opts.imageAt || "top",
      }];
    }
    const sheetCount = sheets.length;
    const parts = [];
    const overrides = [];
    const workbookSheets = [];
    const workbookRels = [];
    let mediaIndex = 0;

    for (let i = 0; i < sheetCount; i++) {
      const s = sheets[i];
      const idx = i + 1;
      const rows = Array.isArray(s.rows) ? s.rows : [];
      const rawImg = s.imageBytes;
      const imageBytes = rawImg && typeof rawImg === "object" && rawImg.byteLength ? toArrayBuffer(rawImg) : null;
      const hasImage = !!imageBytes;
      const widths = s.colWidths || [];
      const maxCol = rows.reduce((m, r) => Math.max(m, r.length), 1);
      const sheetRows = rows
        .map((row, rIdx) => {
          const safeRow = Array.isArray(row) ? row : [row];
          const r = rIdx + 1;
          const cells = safeRow.map((v, j) => {
            const ref = colName(j) + r;
            const empty = v == null || String(v) === "";
            if (typeof v === "number" && isFinite(v)) return `<c r="${ref}" s="1"><v>${v}</v></c>`;
            if (empty) return `<c r="${ref}"/>`;
            return `<c r="${ref}" s="1" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
          });
          return `<row r="${r}">${cells.join("")}</row>`;
        })
        .join("");
      let cols = "";
      for (let j = 0; j < maxCol; j++) cols += `<col min="${j + 1}" max="${j + 1}" width="${widths[j] || 16}"/>`;
      const drawingRef = hasImage ? `<drawing r:id="rId1"/>` : "";
      const sheetXml =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<cols>${cols}</cols><sheetData>${sheetRows}</sheetData>${drawingRef}</worksheet>`;
      const sheetRelsXml =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        (hasImage ? `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${idx}.xml"/>` : "") +
        `</Relationships>`;

      parts.push({ name: `xl/worksheets/sheet${idx}.xml`, data: str2utf8(sheetXml) });
      parts.push({ name: `xl/worksheets/_rels/sheet${idx}.xml.rels`, data: str2utf8(sheetRelsXml) });
      workbookSheets.push(`<sheet name="${esc(s.name)}" sheetId="${idx}" r:id="rId${idx}"/>`);
      workbookRels.push(`<Relationship Id="rId${idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx}.xml"/>`);
      overrides.push(`<Override PartName="/xl/worksheets/sheet${idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);

      if (hasImage) {
        mediaIndex += 1;
        const img = pngSize(imageBytes);
        const scale = Math.min(1, 7000000 / (img.w * 9525), 3200000 / (img.h * 9525));
        const W = Math.round(img.w * 9525 * scale);
        const H = Math.round(img.h * 9525 * scale);
        const anchorRow = s.imageAt === "bottom" ? rows.length + 1 : 0;
        const drawing =
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
          `<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${anchorRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>` +
          `<xdr:ext cx="${W}" cy="${H}"/>` +
          `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="chart.png"/><xdr:cNvPicPr/></xdr:nvPicPr>` +
          `<xdr:blipFill><a:blip r:embed="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
          `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>` +
          `</xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;
        parts.push({ name: `xl/drawings/drawing${idx}.xml`, data: str2utf8(drawing) });
        parts.push({
          name: `xl/drawings/_rels/drawing${idx}.xml.rels`,
          data: str2utf8(
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${mediaIndex}.png"/>` +
            `</Relationships>`
          ),
        });
        parts.push({ name: `xl/media/image${mediaIndex}.png`, data: imageBytes });
        overrides.push(`<Override PartName="/xl/drawings/drawing${idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
      }
    }

    const contentTypes =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Default Extension="png" ContentType="image/png"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      overrides.join("") +
      `</Types>`;
    const stylesXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>` +
      `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
      `<borders count="1"><border><left style="thin"><color rgb="FF9BA8B4"/></left><right style="thin"><color rgb="FF9BA8B4"/></right><top style="thin"><color rgb="FF9BA8B4"/></top><bottom style="thin"><color rgb="FF9BA8B4"/></bottom><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs>` +
      `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
      `</styleSheet>`;
    const rootRels =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`;
    const workbook =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>${workbookSheets.join("")}</sheets></workbook>`;
    const workbookRelsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels.join("")}</Relationships>`;

    const entries = [
      { name: "[Content_Types].xml", data: str2utf8(contentTypes) },
      { name: "_rels/.rels", data: str2utf8(rootRels) },
      { name: "xl/workbook.xml", data: str2utf8(workbook) },
      { name: "xl/_rels/workbook.xml.rels", data: str2utf8(workbookRelsXml) },
      { name: "xl/styles.xml", data: str2utf8(stylesXml) },
    ].concat(parts);
    return buildZip(entries);
  }

  function toArrayBuffer(buf) {
    if (buf instanceof ArrayBuffer) return buf;
    if (buf && buf.buffer && typeof buf.byteLength === "number") {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    return null;
  }

  global.TrailLabXlsx = { buildXlsx };
})(typeof window !== "undefined" ? window : globalThis);
