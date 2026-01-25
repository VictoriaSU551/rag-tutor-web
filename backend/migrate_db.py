#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库迁移脚本：为 Session 表添加 exercises 列
"""
import sqlite3
import sys
from pathlib import Path

def migrate():
    """执行数据库迁移"""
    # 数据库路径
    db_path = Path(__file__).parent / "instance" / "database.db"
    
    if not db_path.exists():
        print(f"❌ 数据库不存在: {db_path}")
        sys.exit(1)
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # 检查 exercises 列是否已存在
        cursor.execute("PRAGMA table_info(session)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'exercises' in columns:
            print("✅ exercises 列已存在，无需迁移")
            conn.close()
            return
        
        # 添加 exercises 列
        cursor.execute("""
            ALTER TABLE session 
            ADD COLUMN exercises TEXT NULL DEFAULT NULL
        """)
        
        conn.commit()
        conn.close()
        
        print("✅ 数据库迁移成功！已添加 exercises 列")
        return True
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("✅ exercises 列已存在")
            return True
        print(f"❌ 迁移失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
