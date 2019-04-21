<?php
Class dbObj{
 /* Database connection start */
 var $servername = "localhost";
 var $username = "id8313605_adminrr";
 var $password = "on1tw2th3fo4";
 var $dbname = "id8313605_greetings";
 var $conn;
 
 function getConnstring() {
    $con = mysqli_connect($this->servername, $this->username, $this->password, $this->dbname) or die("Connection failed: " . mysqli_connect_error());
 
    /* check connection */
    if (mysqli_connect_errno()) {
        printf("Connect failed: %s\n", mysqli_connect_error());
        exit();
    } else {
        $this->conn = $con;
    }
        return $this->conn;
    }
}
 
?>