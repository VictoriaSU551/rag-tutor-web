#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库迁移脚本：创建 quiz_question 表，用于存储所有生成过的题目
"""
import sqlite3
import sys
from pathlib import Path


def migrate():
    """执行数据库迁移：创建 quiz_question 表"""
    # 数据库路径（与 db.py 中的默认路径一致）
    db_path = Path(__file__).parent / "data" / "app.db"

    if not db_path.exists():
        # 尝试 instance 目录
        db_path = Path(__file__).parent / "instance" / "database.db"

    if not db_path.exists():
        print(f"❌ 数据库不存在: {db_path}")
        print("   请先运行 init_db.py 或确认数据库路径")
        sys.exit(1)

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # 检查 quiz_question 表是否已存在
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_question'"
        )
        if cursor.fetchone():
            print("✅ quiz_question 表已存在，无需迁移")
            conn.close()
            return True

        # 创建 quiz_question 表
        cursor.execute("""
            CREATE TABLE quiz_question (
                id            VARCHAR(36) PRIMARY KEY,
                user_id       VARCHAR(36) NOT NULL REFERENCES user(id),
                session_id    VARCHAR(36) REFERENCES session(id),
                question      TEXT        NOT NULL,
                options       TEXT,
                correct_answer TEXT       NOT NULL,
                explanation   TEXT,
                difficulty    VARCHAR(20),
                source_question TEXT,
                message_index INTEGER,
                created_at    INTEGER     NOT NULL
            )
        """)

        conn.commit()
        conn.close()

        print("✅ 数据库迁移成功！已创建 quiz_question 表")
        return True

    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    migrate()
