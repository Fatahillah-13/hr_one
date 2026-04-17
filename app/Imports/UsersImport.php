<?php

namespace App\Imports;

use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UsersImport implements ToCollection, WithHeadingRow
{
    public array $errors = [];
    public int $successCount = 0;

    public function collection(Collection $rows)
    {
        $roles = Role::pluck('id', 'name')->mapWithKeys(fn ($id, $name) => [strtolower($name) => $id]);
        $divisions = Division::pluck('id', 'name')->mapWithKeys(fn ($id, $name) => [strtolower($name) => $id]);

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2 karena heading row + 0-indexed

            $data = [
                'name' => trim($row['name'] ?? ''),
                'username' => trim($row['username'] ?? ''),
                'email' => trim($row['email'] ?? ''),
                'password' => trim($row['password'] ?? ''),
                'role' => trim($row['role'] ?? ''),
                'division' => trim($row['division'] ?? ''),
                'status' => trim($row['status'] ?? 'aktif'),
            ];

            $validator = Validator::make($data, [
                'name' => ['required', 'string', 'max:255'],
                'username' => ['required', 'string', 'max:255', 'unique:users,username'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
            ]);

            if ($validator->fails()) {
                $this->errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                continue;
            }

            $roleId = $roles[strtolower($data['role'])] ?? null;
            $divisionId = $divisions[strtolower($data['division'])] ?? null;

            User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role_id' => $roleId,
                'division_id' => $divisionId,
                'is_active' => strtolower($data['status']) !== 'nonaktif',
            ]);

            $this->successCount++;
        }
    }
}
