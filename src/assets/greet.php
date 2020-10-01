<?php

include("./connection.php");
$db = new dbObj();
$connection =  $db->getConnstring();

$request_method=$_SERVER["REQUEST_METHOD"];

switch($request_method){
case 'GET':
        header("HTTP/1.0 405 Method Not Allowed");
        break;
case 'POST':
        handle_post_request();
    break;
default:
        // Invalid Request Method
        header("HTTP/1.0 405 Method Not Allowed");
    break; 
}

//Function to validate client key against server key 
function validate_Key($client_keyhex){
    $server_key = date("U");
    $client_key = base_convert($client_keyhex, 36, 10);
    
    $t_difference = $server_key - $client_key;
    if($t_difference >= 0 and $t_difference <= 60){
        return true;
    } else {
        return false;
    }
}

//Function to generate sequential id for greetings
function generate_id(){
    $id = base_convert(mt_rand(), 10, 36) . base_convert(date("U"), 10, 36);
    return $id;
}
//-------------- POST Methods ------------

function handle_post_request(){
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data["key"];
    if(!validate_Key($key)){
        header('Content-Type: application/json');
        $response=array(
            'error' => 'INVALID REQUEST ORIGIN',
            'message' =>'401: Access to API DENIED'
        );
        echo json_encode($response);
    } else {

    $action = $data["action"];
    switch($action){
        case 'getgreeting':
            get_greeting($data);
            break;
        case 'getagreeting':
            get_admin_greeting($data);
            break;
        case 'savegreeting':
            save_greeting($data);
            break;
        case 'gettracking':
            get_tracking($data);
            break;
        case 'deleteids':
            delete_ids($data);
            break;
        default:
            // Invalid Request Method
            header("HTTP/1.0 405 Method Not Allowed");
        break; 
        }
    }
}
        
    

function save_greeting($data){

    global $connection;

    $id = generate_id();
    $sn = mysqli_real_escape_string($connection, $data["sn"]);
    $rc = mysqli_real_escape_string($connection, $data["rc"]);
    $gt = mysqli_real_escape_string($connection, $data["gt"]);
    $ty = mysqli_real_escape_string($connection, $data["ty"]);
    
    $query="INSERT INTO greetingtb SET id='".$id."', sender='".$sn."', type='".$ty."',receiver='".$rc."', greeting='".$gt."'";

    if(mysqli_query($connection, $query))
    {
        $response=array(
            'status' => 1,
            'greetingId' => $id
        );
    }
    else
    {
        $response=array(
            'status' => 0,
            'greetingId' => ''
        );
    }
    header('Content-Type: application/json');
    echo json_encode($response);
}

function get_admin_greeting($data){
    global $connection;
    
    $id = mysqli_real_escape_string($connection, $data["id"]);
    $ut = mysqli_real_escape_string($connection, $data["ut"]);

    $query= "SELECT g.sender, g.receiver, g.greeting, g.last, g.count, g.type, IF(m.meta IS NULL, FALSE, TRUE) as atf FROM greetingtb g LEFT JOIN metadata m ON (g.id = m.value) WHERE g.id = '". $id."' AND m.meta = 1 LIMIT 1; ";

    $response=array();
    $result=mysqli_query($connection, $query);
    while($row=mysqli_fetch_assoc($result))
    {
        $response[]=$row;
    }
    
    
    header('Content-Type: application/json');
    echo json_encode($response);
}

function get_greeting($data){
    global $connection;
    
    $id = mysqli_real_escape_string($connection, $data["id"]);
    $ut = mysqli_real_escape_string($connection, $data["ut"]);
    
    $query="SELECT sender, receiver, greeting, last, count, type FROM greetingtb WHERE id = '". $id."' LIMIT 1; ";
    
    if(!$ut){
        $query="SELECT sender, receiver, greeting, type FROM greetingtb WHERE id = '". $id."' LIMIT 1; ";
        $update_query  = "UPDATE greetingtb set count = count + 1, last= '".date("Y-m-d H:i:s")."' WHERE id = '". $id."'";
        $result2 = mysqli_query($connection, $update_query);
    }
            
    
    $response=array();
    $result=mysqli_query($connection, $query);
    while($row=mysqli_fetch_assoc($result))
    {
        $response[]=$row;
    }
    
    
    header('Content-Type: application/json');
    echo json_encode($response);

}

function get_tracking($data){
    global $connection;   

    $query ="SELECT g.id, g.receiver, g.count, g.last FROM greetingtb g JOIN metadata m ON g.id != m.value WHERE m.meta = 1 ORDER BY time DESC LIMIT 0, 200";        
    
    $response=array();
    $result=mysqli_query($connection, $query);
    while($row=mysqli_fetch_assoc($result))
    {
        $response[]=$row;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
}

function delete_ids($data){
    global $connection;

    $ids = $data["ids"];

    $query="DELETE FROM greetingtb WHERE id IN ('" 
     . implode("','",  $ids) 
     . "')";

    if(mysqli_query($connection, $query))
    {
        $response=array(
            'status' => 1,
            'query' => $query
        );
    }
    else
    {
        $response=array(
            'status' => 0,
            'query' => $query
        );
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
}


?>