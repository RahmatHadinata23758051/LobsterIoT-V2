<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Fillable([
    'camera_code',
    'iot_node_id',
    'stream_url',
    'is_active',
    'dvr_ip',
    'port',
    'channel_number',
    'protocol',
    'username',
    'password',
    'rtsp_url',
])]
#[Hidden(['password'])]
class Camera extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'port' => 'integer',
            'channel_number' => 'integer',
            'password' => 'encrypted',
        ];
    }

    protected function computedStreamUrl(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::get(function () {
            if ($this->stream_url) {
                return $this->stream_url;
            }
            if ($this->rtsp_url) {
                return $this->rtsp_url;
            }
            // DVR mode: synthesize the vendor-standard channel URI so the
            // camera stays addressable without a hand-typed URL.
            if ($this->dvr_ip) {
                $protocol = $this->protocol ?: 'rtsp';
                $port = $this->port ?: 554;
                $channel = $this->channel_number ?: 1;

                return "{$protocol}://{$this->dvr_ip}:{$port}/ch{$channel}";
            }

            return null;
        });
    }

    protected $appends = ['computed_stream_url'];

    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class);
    }
}
