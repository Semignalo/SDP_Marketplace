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

        $cities = $rajaOngkir->searchDestinations($search);

        return response()->json(['data' => array_slice($cities, 0, 50)]);
    }
}
