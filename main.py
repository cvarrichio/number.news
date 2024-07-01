from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


from fastapi.responses import FileResponse

@app.get("/")
async def read_index():
    return FileResponse('static/html/index.html')

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./database/news.sqlite"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Content(Base):
    __tablename__ = "content"

    id = Column(String, primary_key=True, index=True)
    display_name = Column(String, index=True)
    content = Column(String)
    default_open = Column(Boolean, default=True)
    default_visible = Column(Boolean, default=True)
    index_title = Column(String)
    display_order = Column(Integer)
    description = Column(String)

Base.metadata.create_all(bind=engine)

# Pydantic models
class ContentOut(BaseModel):
    id: str
    display_name: str
    content: str
    default_open: bool
    default_visible: bool
    index_title: Optional[str]
    display_order: int
    description: Optional[str]

    class Config:
        orm_mode = True

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/test")
def test_api():
    return {"message": "API is working"}

@app.get("/api/content", response_model=List[ContentOut])
def read_content(skip: int = 0, limit: int = 100, db: SessionLocal = Depends(get_db)):
    content = db.query(Content).filter(Content.default_visible == True).order_by(Content.display_order).offset(skip).limit(limit).all()
    return content

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)