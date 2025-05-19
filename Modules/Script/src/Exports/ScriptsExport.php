<?php

namespace Modules\Script\src\Exports;

use Modules\Script\src\Models\Script;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ScriptsExport implements FromCollection, WithHeadings
{
    protected $media1Id;

    public function __construct(int $media1Id)
    {
        $this->media1Id = $media1Id;
    }

    public function collection()
    {
        return Script::where('media1_id', $this->media1Id)
            ->get(['part', 'est_time', 'direction', 'detail', 'note']);
    }

    public function headings(): array
    {
        return ['Part', 'Est. Time', 'Direction', 'Detail', 'Note'];
    }
}