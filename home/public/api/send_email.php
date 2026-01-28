<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Get POST data
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(["message" => "No data provided"]);
    exit;
}

$type = $data->type;
$payload = $data->data;

$toAdmin = "solicitudes@boarsslayers.com";
$fromEmail = "no-reply@boarsslayers.com";

if ($type === 'NEW_APPLICATION') {
    $subject = "Nueva Solicitud de Reclutamiento: " . $payload->username;
    
    $message = "
    <html>
    <head>
      <title>Nueva Solicitud de Boars Slayers</title>
    </head>
    <body style='font-family: sans-serif; background-color: #1c1917; color: #e5e5e5; padding: 20px;'>
      <div style='max-width: 600px; margin: 0 auto; background-color: #292524; padding: 20px; border: 1px solid #d97706; border-radius: 8px;'>
        <h2 style='color: #d97706;'>Nueva Solicitud Recibida</h2>
        <p>Un nuevo guerrero quiere unirse al clan:</p>
        <ul>
          <li><strong>Usuario:</strong> {$payload->username}</li>
          <li><strong>Email:</strong> {$payload->email}</li>
          <li><strong>Motivo:</strong> {$payload->reason}</li>
        </ul>
        <p>Entra al panel de administración para Aceptar o Rechazar.</p>
        <a href='https://boarsslayers.com' style='display: inline-block; padding: 10px 20px; background-color: #d97706; color: #000; text-decoration: none; font-weight: bold; border-radius: 4px;'>Ir al Cuartel</a>
      </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Boars Slayers System <{$fromEmail}>" . "\r\n";

    // Auto-reply to user
    $userSubject = "Tu solicitud a Boars Slayers ha sido recibida";
    $userMessage = "
    <html>
    <body style='font-family: sans-serif; background-color: #1c1917; color: #e5e5e5; padding: 20px;'>
      <div style='max-width: 600px; margin: 0 auto; background-color: #292524; padding: 20px; border-radius: 8px;'>
        <h2 style='color: #d97706;'>¡Saludos, {$payload->username}!</h2>
        <p>Hemos recibido tu solicitud de alistamiento. Nuestros oficiales la revisarán pronto.</p>
        <p>Mantente atento a tu correo.</p>
        <br>
        <p style='color: #78716c; font-size: 12px;'>Boars Slayers Clan</p>
      </div>
    </body>
    </html>
    ";
    
    mail($payload->email, $userSubject, $userMessage, $headers);
    
    if(mail($toAdmin, $subject, $message, $headers)) {
        echo json_encode(["message" => "Email sent successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Email sending failed"]);
    }

} elseif ($type === 'MEMBER_APPROVED') {
    $toUser = $payload->email;
    $subject = "¡Bienvenido a Boars Slayers! - Solicitud Aprobada";
    
    $message = "
    <html>
    <body style='font-family: sans-serif; background-color: #1c1917; color: #e5e5e5; padding: 20px;'>
      <div style='max-width: 600px; margin: 0 auto; background-color: #292524; padding: 20px; border: 1px solid #10b981; border-radius: 8px;'>
        <h2 style='color: #10b981;'>¡Solicitud Aprobada!</h2>
        <p>Felicidades, {$payload->username}. Has sido aceptado en las filas de Boars Slayers.</p>
        
        <p><strong>Siguientes pasos obligatorios:</strong></p>
        <ol>
          <li>Únete a nuestro grupo de WhatsApp oficial:</li>
        </ol>
        
        <a href='https://chat.whatsapp.com/Dz0jyXt0SDX3Me12g3zBkk' style='display: block; text-align: center; padding: 15px; background-color: #25D366; color: #fff; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 20px 0;'>
          Unirse al Grupo de WhatsApp
        </a>

        <p>¡Nos vemos en el campo de batalla!</p>
      </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Boars Slayers Command <{$fromEmail}>" . "\r\n";

    if(mail($toUser, $subject, $message, $headers)) {
        echo json_encode(["message" => "Welcome email sent"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to send welcome email"]);
    }
}
?>
