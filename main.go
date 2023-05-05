package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"
)

// server for running the game
func main() {
	fileServer := http.FileServer(http.Dir("./static/"))
	http.Handle("/static/", http.StripPrefix("/static", fileServer))
	fileServer2 := http.FileServer(http.Dir("./src/"))
	http.Handle("/src/", http.StripPrefix("/src", fileServer2))
	fileServer3 := http.FileServer(http.Dir("./media/"))
	http.Handle("/media/", http.StripPrefix("/media", fileServer3))

	http.HandleFunc("/", mainHandler)
	portNr := getPortNr()
	fmt.Printf("Started server at http://localhost:%v\n", portNr)
	// runs server
	if err := http.ListenAndServe(":"+strconv.Itoa(portNr), nil); err != nil {
		log.Fatal(err)
	}
}

// handles the main page
func mainHandler(w http.ResponseWriter, r *http.Request) {
	temp, err := template.ParseFiles("templates/index.html")
	if err != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
		return
	}
	if e := temp.Execute(w, ""); e != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
	}
}

// checks if inputted port nr exists/is correct
func getPortNr() int {
	if len(os.Args) == 2 {
		n, e := strconv.Atoi(os.Args[1])
		if e == nil && (n > 1023 && n < 65536) {
			return n
		}
	}
	return 8080
}
