<?php

namespace Modules\Core\src\Controllers;

use Illuminate\Routing\Controller;

class CoreController extends Controller
{
    /**
     * Default index method.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('core::index');
    }
}