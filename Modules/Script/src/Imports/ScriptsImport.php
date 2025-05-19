<?php

namespace Modules\Script\src\Imports;

use Modules\Script\src\Models\Script;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ScriptsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
    use SkipsFailures;

    protected $media1Id;
    protected $successCount = 0;
    protected $errors = [];

    public function __construct(int $media1Id)
    {
        $this->media1Id = $media1Id;
        try {
            DB::table('scripts')->where('media1_id', $this->media1Id)->delete();
            Log::info('Deleted existing scripts for media1_id', ['media1_id' => $this->media1Id]);
        } catch (\Exception $e) {
            Log::error('Failed to delete existing scripts', [
                'media1_id' => $this->media1Id,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to clear existing scripts: ' . $e->getMessage(), 500);
        }
    }

    public function model(array $row)
    {
        $this->successCount++;
        return new Script([
            'media1_id' => $this->media1Id,
            'part' => $row['part'],
            'est_time' => $row['est_time'],
            'direction' => $row['direction'],
            'detail' => $row['detail'],
            'note' => $row['note'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'part' => 'required|string|max:255',
            'est_time' => [
                'required',
                'string',
                'max:10',
                'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/'
            ],
            'direction' => 'required|string',
            'detail' => 'required|string',
            'note' => 'nullable|string',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'part.required' => 'The part field is required.',
            'part.string' => 'The part field must be a string.',
            'part.max' => 'The part field may not be greater than 255 characters.',
            'est_time.required' => 'The estimated time field is required.',
            'est_time.string' => 'The estimated time field must be a string.',
            'est_time.max' => 'The estimated time field may not be greater than 10 characters.',
            'est_time.regex' => 'The estimated time field must be in HH:MM:SS format (e.g., 00:00:05).',
            'direction.required' => 'The direction field is required.',
            'direction.string' => 'The direction field must be a string.',
            'detail.required' => 'The detail field is required.',
            'detail.string' => 'The detail field must be a string.',
            'note.string' => 'The note field must be a string.',
        ];
    }

    public function onFailure(\Maatwebsite\Excel\Validators\Failure ...$failures)
    {
        foreach ($failures as $failure) {
            if ($failure === null) {
                Log::warning('Null failure received in ScriptsImport::onFailure', [
                    'media1_id' => $this->media1Id,
                ]);
                continue;
            }

            $rowNumber = $failure->row();
            $errors = $failure->errors();

            if (empty($errors)) {
                Log::warning('Empty errors array in ScriptsImport::onFailure', [
                    'row' => $rowNumber,
                    'media1_id' => $this->media1Id,
                ]);
                continue;
            }

            $this->errors[] = [
                'row' => $rowNumber,
                'errors' => array_reduce($errors, function ($carry, $error) use ($rowNumber) {
                    $fieldMap = [
                        'part' => 'part',
                        'est_time' => 'estimated time',
                        'direction' => 'direction',
                        'detail' => 'detail',
                        'note' => 'note',
                    ];
                    preg_match('/The (.*?) field (.*?)\./', $error, $matches);
                    $field = $matches[1] ?? 'unknown';
                    $message = $matches[2] ?? $error;
                    $fieldKey = array_search($field, $fieldMap) ?: $field;
                    $fullMessage = preg_replace('/\s*in row :row\./', '', $error);
                    $carry[$fieldKey] = [$fullMessage];
                    return $carry;
                }, []),
            ];
        }
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    // Remove validateImport and __destruct
    // Validation will be handled in the controller
}