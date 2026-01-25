from dotenv import load_dotenv
load_dotenv()

from app.rag.retriever import Retriever
from app.config import settings

try:
    retriever = Retriever(settings.INDEX_DIR, settings.TOP_K)
    retriever.load()
    results = retriever.search('死锁是什么')
    print(f'搜索成功！返回 {len(results)} 条结果')
    for r in results[:2]:
        print(f'  - {r["book"]} p{r["page"]}: {r["text"][:50]}...')
except Exception as e:
    print(f'错误: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
