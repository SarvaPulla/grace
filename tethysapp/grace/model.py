from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import sessionmaker
from app import Grace

engine = Grace.get_persistent_store_engine('main_db')

SessionMaker = sessionmaker(bind=engine)
Base = declarative_base()


class Geoserver(Base):
    '''
    Geoserver SQLAlchemy DB Model
    '''
    __tablename__ = 'geoserver'

    # Columns
    id = Column(Integer, primary_key=True)
    name = Column(String)
    url = Column(String)
    username = Column(String)
    password = Column(String)

    def __init__(self, name, url, username, password):
        self.name = name
        self.url = url
        self.username = username
        self.password = password

class Region(Base):
    '''
    Region SQLAlchemy DB Model
    '''

    __tablename__ = 'region'

    # Table Columns

    id = Column(Integer, primary_key=True)
    geoserver_id = Column(Integer, ForeignKey('geoserver.id'))
    display_name = Column(String)
    latlon_bbox = Column(String)


    def __init__(self, geoserver_id,display_name, latlon_bbox):
        """
        Constructor for the table
        """
        self.geoserver_id = geoserver_id
        self.display_name = display_name
        self.latlon_bbox = latlon_bbox
