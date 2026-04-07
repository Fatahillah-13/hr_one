<?php

namespace App\Exceptions;

use Exception;

class SsoException extends Exception
{
    public function __construct(
        string $message,
        protected int $status = 422,
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}
