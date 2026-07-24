<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    #[OA\Post(
        path: "/api/v2/auth/login",
        summary: "Login Pengguna",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password"],
                properties: [
                    new OA\Property(property: "email", type: "string", example: "admin@lobsense.com"),
                    new OA\Property(property: "password", type: "string", example: "password123")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login Berhasil"),
            new OA\Response(response: 411, description: "Email atau password tidak valid"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => [
                'required',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
            ],
        ], [
            'password.min' => 'Kata sandi wajib memiliki minimal 8 karakter.',
            'password.regex' => 'Kata sandi wajib mengandung kombinasi huruf besar, huruf kecil, dan angka.',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Email atau password yang dimasukan tidak valid.', null, 411);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success('Successfully authenticated!', [
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_picture' => $user->profile_picture,
            ]
        ]);
    }

    /**
     * Retrieve currently authenticated user context.
     */
    #[OA\Get(
        path: "/api/v2/profile",
        summary: "Profil Pengguna Aktif",
        description: "Mengambil data profil pengguna yang sedang terautentikasi.",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Profil berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function profile(Request $request)
    {
        $user = $request->user();

        return $this->success('Profile retrieved', [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_picture' => $user->profile_picture,
        ]);
    }

    /**
     * Update authenticated user profile details.
     */
    #[OA\Put(
        path: "/api/v2/profile",
        summary: "Update Profil Pengguna",
        description: "Mengubah nama dan email pengguna yang sedang terautentikasi.",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "email"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Rahmat Hadinata"),
                    new OA\Property(property: "email", type: "string", example: "admin@lobsense.com")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Profil berhasil diperbarui"),
            new OA\Response(response: 422, description: "Validasi gagal"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return $this->success('Profile updated successfully', [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    /**
     * Revoke authenticated user token (Logout).
     */
    #[OA\Post(
        path: "/api/v2/auth/logout",
        summary: "Logout Pengguna",
        description: "Mencabut token akses pengguna (logout sesi aktif).",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Berhasil logout"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success('Successfully logged out!');
    }

    /**
     * Standard success JSON response envelope.
     */
    protected function success(string $message, $data = null, int $status = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $status);
    }

    /**
     * Standard error JSON response envelope.
     */
    protected function error(string $message, $data = null, int $status = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => $data
        ], $status);
    }
}
