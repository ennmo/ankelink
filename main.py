import random
import sqlite3
import string

import uvicorn
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
DB_NAME = "db.db"
DOMAIN = "link.ankevp.net"


def init_db():
    with sqlite3.connect(DB_NAME) as db_init_conn:
        db_init_conn.execute("CREATE TABLE IF NOT EXISTS urls (short TEXT PRIMARY KEY, long TEXT)")
        db_init_conn.execute("CREATE INDEX IF NOT EXISTS idx_long ON urls(long)")


init_db()
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def home():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()


@app.post("/shorten")
async def shorten(url: str = Form(..., alias="url")):
    if len(url) > 2048:
        raise HTTPException(400, "URL is too long")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    with sqlite3.connect(DB_NAME) as db_conn:
        existing = db_conn.execute("SELECT short FROM urls WHERE long=?", (url,)).fetchone()
        if existing:
            short_code = existing[0]
        else:
            chars = string.ascii_letters + string.digits
            while True:
                short = "".join(random.choices(chars, k=6))
                collision = db_conn.execute("SELECT 1 FROM urls WHERE short=?", (short,)).fetchone()
                if not collision:
                    break
            db_conn.execute("INSERT INTO urls VALUES (?, ?)", (short, url))
            short_code = short

    return {
        "copy_url": f"https://{DOMAIN}/{short_code}",
        "display_url": f"{DOMAIN}/{short_code}"
    }


@app.get("/{short}")
async def redirect(short: str):
    if not short.isalnum() or len(short) > 10:
        raise HTTPException(400, "Invalid code format")

    with sqlite3.connect(DB_NAME) as db_conn:
        res = db_conn.execute("SELECT long FROM urls WHERE short=?", (short,)).fetchone()
    if res:
        return RedirectResponse(res[0])
    raise HTTPException(404, "Not Found")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=7521)
