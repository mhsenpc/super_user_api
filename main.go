package main

import (
    "fmt"
    "log"
    "net/http"
    "os/exec"
)

func home(w http.ResponseWriter, r *http.Request){
    fmt.Fprintf(w, "Welcome to the HomePage!")
}

func reload_nginx(w http.ResponseWriter, r *http.Request){
    cmd := exec.Command("/usr/sbin/nginx","-s","reload")
    stdout, err := cmd.Output()

    if err != nil {
        fmt.Fprintf(w, err.Error())
        fmt.Println(err.Error())
        return
    }

    // Print the output
    fmt.Fprintf(w, stdout)
    fmt.Println(string(stdout))
}

func handleRequests() {
    http.HandleFunc("/", home)
    http.HandleFunc("/reload_nginx", reload_nginx)
    log.Fatal(http.ListenAndServe("127.0.0.1:10000", nil))
}

func main() {
    handleRequests()
}
