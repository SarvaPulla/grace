from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import *
from utilities import *
import json


def get_plot(request):

    return_obj = {}

    if request.is_ajax() and request.method == 'POST':
        # Get the point/polygon/shapefile coordinates along with the selected variable
        pt_coords = request.POST['point-lat-lon']
        poly_coords = request.POST['poly-lat-lon']
        shp_bounds = request.POST['shp-lat-lon']

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