"""mysql-connector-python connection pool — raw SQL, no ORM."""
import os
from contextlib import contextmanager
import mysql.connector
from mysql.connector import pooling

MYSQL_CONFIG = {
    "host":     os.getenv("MYSQL_HOST",     "localhost"),
    "user":     os.getenv("MYSQL_USER",     "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DB",       "evenzo"),
    "autocommit": False,
}

_pool = None  # type: pooling.MySQLConnectionPool


def init_pool(pool_size: int = 5):
    global _pool
    _pool = pooling.MySQLConnectionPool(
        pool_name="evenzo_pool",
        pool_size=pool_size,
        **MYSQL_CONFIG,
    )


def get_pool() -> pooling.MySQLConnectionPool:
    if _pool is None:
        init_pool()
    return _pool


@contextmanager
def get_conn():
    """Yields a raw connection — caller manages commit/rollback.
    Closing a pooled connection returns it to the pool."""
    conn = get_pool().get_connection()
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_cursor(commit: bool = True):
    """Yields an auto-committing cursor."""
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            yield cur
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
