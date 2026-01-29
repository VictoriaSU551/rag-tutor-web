import os, json, math
import fitz  # PyMuPDF

def iter_pdf_pages(pdf_path: str):
    doc = fitz.open(pdf_path)
    for i in range(doc.page_count):
        text = doc.load_page(i).get_text("text") or ""
        yield i + 1, text  # 页码从1开始

def chunk_text(text: str, chunk_size: int, overlap: int):
    text = text.replace("\u0000", "")
    if not text.strip():
        return []
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + chunk_size)
        chunks.append(text[start:end])
        if end == n:
            break
        start = max(0, end - overlap)
    return chunks

def build_corpus(pdf_dir: str, chunk_size: int, overlap: int, out_meta_jsonl: str):
    os.makedirs(os.path.dirname(out_meta_jsonl), exist_ok=True)

    metas = []
    with open(out_meta_jsonl, "w", encoding="utf-8") as f:
        for fn in sorted(os.listdir(pdf_dir)):
            if not fn.lower().endswith(".pdf"):
                continue
            path = os.path.join(pdf_dir, fn)
            for page_no, page_text in iter_pdf_pages(path):
                for idx, ch in enumerate(chunk_text(page_text, chunk_size, overlap)):
                    meta = {
                        "id": len(metas),
                        "book": fn,
                        "page": page_no,
                        "chunk_idx": idx,
                        "text": ch.strip()
                    }
                    metas.append(meta)
                    f.write(json.dumps(meta, ensure_ascii=False) + "\n")
    return metas
