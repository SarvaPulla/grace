from django.http import JsonResponse, HttpResponse, Http404
from django.shortcuts import render
from django.contrib.auth.decorators import login_required,user_passes_test
from django.views.decorators.csrf import csrf_exempt
from tethys_sdk.gizmos import *
from utilities import *
import json
from tethys_dataset_services.engines import GeoServerSpatialDatasetEngine
from sqlalchemy.orm.exc import ObjectDeletedError
from sqlalchemy.exc import IntegrityError
from model import *
import requests, urlparse
from gbyos import *
GRACE_NETCDF_DIR = '/home/tethys/netcdf/'
GLOBAL_NETCDF_DIR = '/home/tethys/netcdf/global/'


def get_plot(request):

    return_obj = {}

    if request.is_ajax() and request.method == 'POST':
        # Get the point/polygon/shapefile coordinates along with the selected variable
        pt_coords = request.POST['point-lat-lon']
        # poly_coords = request.POST['poly-lat-lon']
        # shp_bounds = request.POST['shp-lat-lon']

        if pt_coords:
            graph = get_pt_plot(pt_coords)
            graph = json.loads(graph)
            return_obj["values"] = graph["values"]
            return_obj["location"] = graph["point"]

        return_obj['success'] = "success"

    return JsonResponse(return_obj)

def get_plot_global(request):

    return_obj = {}

    if request.is_ajax() and request.method == 'POST':
        # Get the point/polygon/shapefile coordinates along with the selected variable
        pt_coords = request.POST['point-lat-lon']
        poly_coords = request.POST['poly-lat-lon']
        shp_bounds = request.POST['shp-lat-lon']

        if pt_coords:
            graph = get_global_plot(pt_coords)
            graph = json.loads(graph)
            return_obj["values"] = graph["values"]
            return_obj["location"] = graph["point"]

        return_obj['success'] = "success"


    return JsonResponse(return_obj)



@user_passes_test(user_permission_test)
def region_add(request):

    response = {}

    if request.is_ajax() and request.method == 'POST':
        info = request.POST

        region_name = info.get('region_name')
        region_store = ''.join(region_name.split()).lower()
        geoserver_id = info.get('geoserver')


        shapefile = request.FILES.getlist('shapefile')

        Base.metadata.create_all(engine)
        session = SessionMaker()


        geoserver = session.query(Geoserver).get(geoserver_id)
        url,uname,pwd = geoserver.url,geoserver.username,geoserver.password
        process_shapefile(shapefile, url, uname, pwd, region_store, GRACE_NETCDF_DIR, GLOBAL_NETCDF_DIR)
        spatial_data_engine = GeoServerSpatialDatasetEngine(endpoint=url,username=uname,password=pwd)

        #Check if workspace exists
        ws_name = "grace_subset_regions"
        geoserver_uri = 'http://www.tethys.byu.edu/apps/grace'
        response = spatial_data_engine.list_workspaces()

        if response['success']:
            workspaces = response['result']

            if ws_name not in workspaces:
                spatial_data_engine.create_workspace(workspace_id=ws_name,uri=geoserver_uri)

        store_id = ws_name + ':' + region_store
        spatial_data_engine.create_shapefile_resource(store_id=store_id,shapefile_upload=shapefile,overwrite=True,debug=True)

        store_info = spatial_data_engine.get_store(store_id)
        store_info_url = '{0}workspaces/{1}/datastores/{2}/featuretypes.json'.format(url,ws_name,region_store)

        r = requests.get(store_info_url,auth=(uname,pwd))

        if r.status_code != 200:
            response = {"Error:Geoserver seems to be down!"}
        else:
            feature_type_json = r.json()
            print feature_type_json
            layer_name =  feature_type_json["featureTypes"]["featureType"][0]["name"]

        layer_info = spatial_data_engine.get_layer(ws_name+":"+layer_name)

        kmlurl = layer_info['result']['wms']['kml']
        parsedkml = urlparse.urlparse(kmlurl)
        bbox = urlparse.parse_qs(parsedkml.query)['bbox'][0]
        projection = urlparse.parse_qs(parsedkml.query)['srs'][0]
        geoserver_wfs_url = url[:-5]

        wfs_url = '{}{}/ows?service=WFS&version=1.0.0&request=GetFeature&typeNames={}:{}&outputFormat=json&format_options=callback:getJson'.format(geoserver_wfs_url,ws_name,ws_name,layer_name)


        region = Region(display_name=region_name, latlon_bbox=bbox, projection=projection, wfs_url=wfs_url)
        session.add(region)
        session.commit()
        session.close()

        response = {"success":"success"}

        return JsonResponse(response)

@user_passes_test(user_permission_test)
def geoserver_add(request):

    response = {}

    if request.is_ajax() and request.method == 'POST':
        info = request.POST

        geoserver_name = info.get('geoserver_name')
        geoserver_url = info.get('geoserver_url')
        geoserver_username = info.get('geoserver_username')
        geoserver_password = info.get('geoserver_password')

        try:
            spatial_dataset_engine = GeoServerSpatialDatasetEngine(endpoint=geoserver_url,username=geoserver_username,password=geoserver_password)
            layer_list = spatial_dataset_engine.list_layers(debug=True)
            if layer_list:
                Base.metadata.create_all(engine)
                session = SessionMaker()
                geoserver = Geoserver(name=geoserver_name, url=geoserver_url, username=geoserver_username, password=geoserver_password)
                session.add(geoserver)
                session.commit()
                session.close()
                response = {"data": geoserver_name, "success": "Success"}
        except:
            response={"error":"Error processing the Geoserver URL. Please check the url,username and password."}


        return JsonResponse(response)


@user_passes_test(user_permission_test)
def geoserver_update(request):
    """
    Controller for updating a geoserver.
    """
    if request.is_ajax() and request.method == 'POST':
        # get/check information from AJAX request
        post_info = request.POST
        geoserver_id = post_info.get('geoserver_id')
        geoserver_name = post_info.get('geoserver_name')
        geoserver_url = post_info.get('geoserver_url')
        geoserver_username = post_info.get('geoserver_username')
        geoserver_password = post_info.get('geoserver_password')
        # check data
        if not geoserver_id or not geoserver_name or not geoserver_url or not \
                geoserver_username or not geoserver_password:
            return JsonResponse({'error': "Missing input data."})
        # make sure id is id
        try:
            int(geoserver_id)
        except ValueError:
            return JsonResponse({'error': 'Geoserver id is faulty.'})

        Base.metadata.create_all(engine)
        session = SessionMaker()

        geoserver = session.query(Geoserver).get(geoserver_id)
        try:
            spatial_dataset_engine = GeoServerSpatialDatasetEngine(endpoint=geoserver_url, username=geoserver_username,
                                                                   password=geoserver_password)
            layer_list = spatial_dataset_engine.list_layers(debug=True)
            if layer_list:


                geoserver.geoserver_name = geoserver_name
                geoserver.geoserver_url = geoserver_url
                geoserver.geoserver_username = geoserver_username
                geoserver.geoserver_password = geoserver_password

                session.commit()
                session.close()
                return JsonResponse({'success': "Geoserver sucessfully updated!"})
        except:
            return JsonResponse({'error': "A problem with your request exists."})


@user_passes_test(user_permission_test)
def geoserver_delete(request):
    """
    Controller for deleting a geoserver.
    """
    if request.is_ajax() and request.method == 'POST':
        # get/check information from AJAX request
        post_info = request.POST
        geoserver_id = post_info.get('geoserver_id')

        # initialize session
        session = SessionMaker()
        try:
            # delete geoserver
            try:
                geoserver = session.query(Geoserver).get(geoserver_id)
            except ObjectDeletedError:
                session.close()
                return JsonResponse({'error': "The geoserver to delete does not exist."})
            session.delete(geoserver)
            session.commit()
            session.close()
        except IntegrityError:
            session.close()
            return JsonResponse(
                {'error': "This geoserver is connected with a watershed! Must remove connection to delete."})
        return JsonResponse({'success': "Geoserver sucessfully deleted!"})
    return JsonResponse({'error': "A problem with your request exists."})

