<?php
/**
 * DECA Health and Wellness — appointment request handler.
 * Receives the contact form and emails it to the clinic.
 * Requires PHP mail() (available on HostGator / most cPanel hosts).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$TO        = 'info@decahealthandwellness.com';
// Must be an address on your own domain so it passes SPF/DKIM and is not spam-filtered.
$FROM      = 'noreply@decahealthandwellness.com';
$FROM_NAME = 'DECA Website';

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'Method not allowed.');
}

/** Single-line value: strip CR/LF so it can never inject mail headers. */
function one_line(string $v, int $max = 200): string {
    $v = str_replace(["\r", "\n", "\0"], ' ', trim($v));
    return mb_substr($v, 0, $max);
}

/** Multi-line value: keep newlines (body only, never headers). */
function multi_line(string $v, int $max = 4000): string {
    $v = str_replace(["\r\n", "\r"], "\n", trim($v));
    $v = str_replace("\0", '', $v);
    return mb_substr($v, 0, $max);
}

// Honeypot — bots fill hidden fields; humans never see it.
if (one_line((string)($_POST['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true]);   // silently accept, don't tip off the bot
    exit;
}

$fname   = one_line((string)($_POST['fname']   ?? ''), 80);
$lname   = one_line((string)($_POST['lname']   ?? ''), 80);
$email   = one_line((string)($_POST['email']   ?? ''), 160);
$phone   = one_line((string)($_POST['phone']   ?? ''), 40);
$service = one_line((string)($_POST['service'] ?? ''), 80);
$message = multi_line((string)($_POST['message'] ?? ''));

$missing = [];
foreach (['First name' => $fname, 'Last name' => $lname, 'Email' => $email,
          'Phone' => $phone, 'Service' => $service] as $label => $val) {
    if ($val === '') { $missing[] = $label; }
}
if ($missing) {
    fail(422, 'Please complete: ' . implode(', ', $missing) . '.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Please enter a valid email address.');
}
if (strlen(preg_replace('/\D/', '', $phone)) < 10) {
    fail(422, 'Please enter a valid phone number.');
}

$name    = $fname . ' ' . $lname;
$subject = 'New appointment request — ' . $name . ' (' . $service . ')';

$body = "New appointment request from the DECA website\n"
      . str_repeat('=', 46) . "\n\n"
      . "Name:     {$name}\n"
      . "Email:    {$email}\n"
      . "Phone:    {$phone}\n"
      . "Service:  {$service}\n\n"
      . "Message:\n" . ($message !== '' ? $message : '(none provided)') . "\n\n"
      . str_repeat('-', 46) . "\n"
      . 'Submitted: ' . date('D, j M Y g:i a') . " (server time)\n"
      . 'IP:        ' . one_line((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 45) . "\n"
      . 'Page:      ' . one_line((string)($_SERVER['HTTP_REFERER'] ?? 'unknown'), 200) . "\n";

$headers = [
    'From: ' . sprintf('%s <%s>', $FROM_NAME, $FROM),
    'Reply-To: ' . sprintf('%s <%s>', $name, $email),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($TO, $subject, $body, implode("\r\n", $headers), '-f' . $FROM);

if (!$sent) {
    fail(500, 'We could not send your request. Please call us at 905-674-6477.');
}

echo json_encode(['ok' => true]);
