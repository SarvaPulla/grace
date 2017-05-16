from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import *
import csv, os
from datetime import datetime,timedelta
from tethys_sdk.services import get_spatial_dataset_engine
import urlparse
from grace import *
from utilities import *
import json,time
from .app import Grace

@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    # file_dir = '/home/tethys/geotiff_clipped/'
    # output_dir = '/home/tethys/geotiff_global/'

    # create_global_geotiffs(file_dir,output_dir)
    # infile = '/home/tethys/netcdf/grace.nc'
    # var_name = 'lwe_thickness'
    # xsize, ysize, GeoT,NDV= get_netcdf_info_global(infile,var_name)
    # create_global_tiff(var_name,xsize,ysize,GeoT,NDV)

    # create_geotiffs(file_dir,output_dir)
    # file_dir = '/home/tethys/geotiff_global/'
    # geoserver_rest_url = 'http://tethys.byu.edu:8181/geoserver/rest'
    # workspace = 'globalgrace'
    # upload__global_tiff(file_dir, geoserver_rest_url, workspace)
    # file_dir = '/home/tethys/netcdf/'
    # output_dir = '/home/tethys/'
    # get_max_min(file_dir,output_dir)
    # clip_raster()
    # clip_world()
    # create_world_json()
    context = {}

    return render(request, 'grace/home.html', context)

@login_required
def nepal_graph(request):

    #Creating the Chart

    user_workspace = Grace.get_app_workspace()

    csv_file = os.path.join(user_workspace.path, 'output/Nepal/hydrograph.csv')



    with open(csv_file, 'rb') as f:
        reader = csv.reader(f)
        csvlist = list(reader)

    volume_time_series = []
    volume = []
    x_tracker = []
    formatter_string = "%m/%d/%Y"
    for item in csvlist:
        mydate = datetime.strptime(item[0], formatter_string)
        mydate = time.mktime(mydate.timetuple())*1000
        volume_time_series.append([mydate, float(item[1])])
        volume.append(float(item[1]))
        x_tracker.append(mydate)

    range = [round(min(volume),2),round(max(volume),2)]
    range = json.dumps(range)

    # Configure the time series Plot View
    grace_plot = TimeSeries(
        engine='highcharts',
        title= 'Nepal GRACE Data',
        y_axis_title='Volume',
        y_axis_units='cm',
        series=[
            {
                'name': 'Change in Volume',
                'color': '#0066ff',
                'data': volume_time_series,
            },
            {
                'name':'Tracker',
                'color': '#ff0000',
                'data':[[min(x_tracker),-50],[min(x_tracker),50]]
            },
        ],
        width='100%',
        height='300px'
    )

    #Connecting to the Geoserver
    geoserver_engine = get_spatial_dataset_engine(name='default')
    stores = geoserver_engine.list_stores(workspace='grace')

    grace_layer_options = []
    sorted_stores = sorted(stores['result'],key=lambda x:datetime.strptime(x,'%Y_%m_%d_nepal'))
    for store in sorted_stores:

        year = int(store.split('_')[0])
        month = int(store.split('_')[1])
        day = int(store.split('_')[2])
        date_str = datetime(year,month,day)
        date_str = date_str.strftime("%Y %B %d")
        grace_layer_options.append([date_str,store])

    slider_max = len(grace_layer_options)

    select_layer = SelectInput(display_text='Select a day',
                               name='select_layer',
                               multiple=False,
                               options=grace_layer_options,)
    legend_file = os.path.join(user_workspace.path, 'output/Nepal/legend.csv')


    with open(legend_file, 'rb') as f:
        reader = csv.reader(f)
        legend_list = list(reader)

    legend_json = json.dumps(legend_list)
    x_tracker = json.dumps(x_tracker)



    context = {'grace_plot': grace_plot,'select_layer':select_layer,'layers_json':legend_json,'range':range,'slider_max':slider_max,'x_tracker':x_tracker}

    return render(request, 'grace/nepal_graph.html', context)

@login_required
def global_map(request):

    color_bar = get_color_bar()
    color_bar = json.dumps(color_bar)
    # Connecting to the Geoserver
    geoserver_engine = get_spatial_dataset_engine(name='default')
    stores = geoserver_engine.list_stores(workspace='globalgrace')

    grace_layer_options = []
    sorted_stores = sorted(stores['result'], key=lambda x: datetime.strptime(x, '%Y_%m_%d'))
    for store in sorted_stores:
        year = int(store.split('_')[0])
        month = int(store.split('_')[1])
        day = int(store.split('_')[2])
        date_str = datetime(year, month, day)
        date_str = date_str.strftime("%Y %B %d")
        grace_layer_options.append([date_str, store])

    slider_max = len(grace_layer_options)

    select_layer = SelectInput(display_text='Select a day',
                               name='select_layer',
                               multiple=False,
                               options=grace_layer_options, )



    context = {'select_layer':select_layer,'slider_max':slider_max,"color_bar":color_bar}

    return render(request, 'grace/global_map.html', context)
