# GRACE

**This app is created to run in the Teyths Platform programming environment.
See: https://github.com/tethysplatform/tethys and http://docs.tethysplatform.org/en/latest/**

## Prerequisites:
- Tethys Platform (CKAN, PostgresQL, GeoServer)
- gdal (Python package for working with geospatial data)
- numpy (Python package for scientific computing)
- netCDF4 (Python package for reading and writing netCDF files)
- fiona (Python package for reading and writing spatial data files)
- shapely (Python package for set-theoretic analysis and manipulation of planar features)
- pyshp (Python package for reading and writing ESRI shapefiles)
- rtree (Python wrapper of libpspatialindex)

### Install Tathys Platform
See: http://docs.tethysplatform.org/en/latest/installation.html

### Installing Python Packages
##### For Tethys 1.4 or earlier
Install the packages in the Tethys Virtual environment using pip or as directed by the package developer
```
$ sudo su
$ . /usr/lib/tethys/bin/activate
$ pip install fiona
$ exit
```

## Installation:
Clone the app into the directory you want:
```
$ git clone https://github.com/SarvaPulla/grace.git
$ cd servirdi
```

Then install the app into the Tethys Platform.

### Installation for App Development:
```
$ . /usr/lib/tethys/bin/activate
$ cd grace
$ python setup.py develop
```
### Installation for Production:
```
$ . /usr/lib/tethys/bin/activate
$ cd servirdi
$ python setup.py install
$ tethys manage collectstatic
```

#### Enable CORS on geoserver

##### For Tethys 1.3
Create a new bash session in the tethys_geoserver docker container:
```
$ . /usr/lib/tethys/bin/activate
$ docker exec -it tethys_geoserver /bin/bash
$ vi /var/lib/tomcat7/webapps/geoserver/WEB-INF/web.xml
```
Insert the following in the filters list:
```
<filter>
    <filter-name>CorsFilter</filter-name>
    <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
    <init-param>
      <param-name>cors.allowed.origins</param-name>
      <param-value>http://127.0.0.1:8000, http://127.0.0.1:8181</param-value>
    </init-param>
</filter>
```
Insert this filter-mapping to the filter-mapping list:
```
<filter-mapping>
    <filter-name>CorsFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```
Save the web.xml file.
```
$ exit
$ docker restart tethys_geoserver
```
##### For Tethys 1.4
Create a new bash session in the tethys_geoserver docker container:

```
$ . /usr/lib/tethys/bin/activate
$ docker exec -it tethys_geoserver /bin/bash
$ cd node1/webapps/geoserver/WEB-INF
$ vi web.xml
```
Note: You can make this change to any other node in the geoserver docker.

Insert the following in the filters list:
```
<filter>
    <filter-name>CorsFilter</filter-name>
    <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
    <init-param>
      <param-name>cors.allowed.origins</param-name>
      <param-value>http://127.0.0.1:8000, http://127.0.0.1:8181</param-value>
    </init-param>
</filter>
```
Insert this filter-mapping to the filter-mapping list:
```
<filter-mapping>
    <filter-name>CorsFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```
Save the web.xml file.
```
$ exit
$ docker restart tethys_geoserver
```

## Updating the App:
Update the local repository and Tethys Platform instance.
```
$ . /usr/lib/tethys/bin/activate
$ cd grace
$ git stash
$ git pull
```

Restart the Apache Server:
See: http://docs.tethysplatform.org/en/latest/production/installation.html#enable-site-and-restart-apache
