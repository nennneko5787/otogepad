from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, ORJSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from web.iidx import router as iidxRouter
from web.nostalgia import router as nosRouter

app = FastAPI(default_response_class=ORJSONResponse)
templates = Jinja2Templates("pages")

app.mount("/static", StaticFiles(directory="static"), "static")

app.include_router(iidxRouter)
app.include_router(nosRouter)


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html", {})


@app.get("/manifest.json")
def manifest():
    return {
        "short_name": "OtogePad",
        "name": "OtogePad",
        "start_url": "/",
        "display": "standalone",
    }


@app.get("/sw.js")
def swjs():
    return FileResponse("sw/sw.js")


@app.get("/iidx")
def iidx(request: Request):
    return templates.TemplateResponse(request, "iidx.html", {})


@app.get("/nostalgia")
def nostalgia(request: Request):
    return templates.TemplateResponse(request, "nostalgia.html", {})
