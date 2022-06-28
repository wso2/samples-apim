package wso2.booksservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wso2.booksservice.model.Book;

@RestController public class BooksController {
    String sampleBookList = "    {\"books\":[   \n"
                                    + "        {\"name\":\"Beginning WSO2 ESB\", \"author\":\"Kasun Indrasiri\"},    \n"
                                    + "        {\"name\":\"Microservices for the Enterprise\", \"author\":\"Kasun Indrasiri and Prabath Siriwardena\"},\n"
                                    + "        {\"name\":\"Microservices Security in Action\", \"author\":\"Prabath Siriwardena and Nuwan Dias\"},\n"
                                    + "        {\"name\":\"Beginning Ballerina Programming: From Novice to Professional\", \"author\":\"Anjana Fernando and Lakmal Warusawithana\"},     \n"
                                    + "        {\"name\":\"API Automation and Scaling\", \"author\":\"WSO2 Team\"},    \n"
                                    + "        {\"name\":\"Navigating the Digital Transformation Landscape\", \"author\":\"WSO2 Team\"},               \n"
                                    + "        {\"name\":\"Enterprise Integration with WSO2 ESB\", \"author\":\"Prabath Siriwardena\"}\n"
                                    + "    ]}  ";

    String sampleBook = "{\n" + "   \"name\":\"Microservices Security in Action\",\n"
                                    + "   \"author\":\"Prabath Siriwardena and Nuwan Dias\",\n"
                                    + "   \"isbn\":\"9781617295959\",\n" + "   \"editionNo\":\"1\",\n"
                                    + "   \"publisher\":\"Manning Publications\",\n" + "   \"publishedYear\":\"2020\"\n"
                                    + "}";

    @RequestMapping(value = "/", method = RequestMethod.GET) public String index() {
        return "Welcome to Books API";
    }

    @GetMapping("/books") public ResponseEntity<?> getBooks() {
        // TODO: Implementation for HTTP GET request
        System.out.println("GET books invoked");
        return new ResponseEntity<>(sampleBookList + "\n", HttpStatus.OK);
    }

    @GetMapping("/books/{bookId}") public ResponseEntity<?> getBookById(@PathVariable("bookId") String code) {
        // TODO: Implementation for HTTP GET request
        System.out.println("GET book by bookId invoked");
        return new ResponseEntity<>(sampleBook + "\n" + code, HttpStatus.OK);
    }

    @PostMapping("/books") public ResponseEntity<?> addBook(@RequestBody Book book) {
        // TODO: Implementation for HTTP POST request
        System.out.println("Add book invoked");
        return new ResponseEntity<>("Book added with name: " + book.getName() + " written by " + book.getAuthor()
                                        + "\n", HttpStatus.CREATED);
    }

    @PutMapping("/books/{bookId}") public ResponseEntity<?> put(@PathVariable("bookId") String bookId,
                                    @RequestBody Book book) {
        // TODO: Implementation for HTTP PUT request
        System.out.println("PUT invoked");
        return new ResponseEntity<>("Book information updated for book id:" + bookId + ", book name:" + book.getName()
                                        + "\n", HttpStatus.OK);
    }

    @DeleteMapping("/books/{bookId}") public ResponseEntity<?> delete(@PathVariable("bookId") String bookId) {
        // TODO: Implementation for HTTP DELETE request
        return new ResponseEntity<>(HttpStatus.OK);
    }

}
