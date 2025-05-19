<?php

namespace Modules\Script\src\Imports;

use Modules\Script\src\Models\Script;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ScriptsImport implements ToModel, WithHeadingRow
{
    protected $media1Id;

    public function __construct(int $media1Id)
    {
        $this->media1Id = $media1Id;
    }

    public function model(array $row)
    {
        return new Script([
            'media1_id' => $this->media1Id,
            'part' => $row['part'],
            'est_time' => $row['est_time'],
            'direction' => $row['direction'],
            'detail' => $row['detail'],
            'note' => $row['note'] ?? null,
        ]);
    }
}