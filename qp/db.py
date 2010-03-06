from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import (Column, PickleType, String, Integer, Boolean, ForeignKey, Binary, DateTime, Text)
from sqlalchemy.exc import DBAPIError

SqlaBase = declarative_base()

class Base(SqlaBase):
    #eventually I'll put some wrapper functions here, or so I think...
    pass

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
