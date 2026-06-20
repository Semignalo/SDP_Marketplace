<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RajaOngkirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RajaOngkirController extends Controller
{
    public function cities(Request $request, RajaOngkirService $rajaOngkir): JsonResponse
    {
        $search = trim($request->query('search', ''));

        $cities = $rajaOngkir->searchCities($search);

        return response()->json(['data' => array_slice($cities, 0, 15)]);
    }

    public function districts(Request $request, RajaOngkirService $rajaOngkir): JsonResponse
    {
        $city = trim($request->query('city', ''));
        $search = trim($request->query('search', ''));

        $districts = $rajaOngkir->searchDistricts($city, $search);

        return response()->json(['data' => array_slice($districts, 0, 50)]);
    }
}
