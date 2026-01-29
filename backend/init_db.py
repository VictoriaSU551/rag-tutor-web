#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库初始化脚本：创建所有表
"""
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from app.db import engine, Base
from app.models import User, Session  # 导入模型以确保它们被注册

def init_db():
    """创建所有数据库表"""
    try:
        Base.metadata.create_all(engine)
        print("✅ 数据库初始化成功！所有表已创建")
        
        # 验证 Session 表的列
        from sqlalchemy import inspect
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('session')]
        print(f"\n📋 Session 表的列：")
        for col in columns:
            print(f"  - {col}")
        
        if 'exercises' in columns:
            print("\n✅ exercises 列已存在！")
        else:
            print("\n⚠️  exercises 列不存在，可能需要手动添加")
        
        return True
        
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
