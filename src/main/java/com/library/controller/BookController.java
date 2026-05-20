package com.library.controller;

import com.library.model.Book;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*") // Enable CORS for easier testing
public class BookController {

    private final Map<Long, Book> bookDatabase = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public BookController() {
        // Pre-populate with beautiful sample books for direct testing
        addSampleBook("Clean Code", "Robert C. Martin", "978-0132350884");
        addSampleBook("The Pragmatic Programmer", "Andy Hunt & Dave Thomas", "978-0135957059");
        addSampleBook("Design Patterns", "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", "978-0201633610");
        addSampleBook("Docker Deep Dive", "Nigel Poulton", "978-1916585126");
        addSampleBook("Continuous Delivery", "Jez Humble & David Farley", "978-0321601919");
    }

    private void addSampleBook(String title, String author, String isbn) {
        long id = idGenerator.incrementAndGet();
        Book book = new Book(id, title, author, isbn);
        bookDatabase.put(id, book);
    }

    // Get all books or search by title
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks(@RequestParam(required = false) String search) {
        List<Book> books = new ArrayList<>(bookDatabase.values());
        if (search != null && !search.trim().isEmpty()) {
            String lowerSearch = search.toLowerCase();
            books = books.stream()
                    .filter(b -> b.getTitle().toLowerCase().contains(lowerSearch) || 
                                 b.getAuthor().toLowerCase().contains(lowerSearch) ||
                                 b.getIsbn().contains(lowerSearch))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(books);
    }

    // Get a specific book
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        Book book = bookDatabase.get(id);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(book);
    }

    // Add a new book
    @PostMapping
    public ResponseEntity<Book> addBook(@Valid @RequestBody Book book) {
        long id = idGenerator.incrementAndGet();
        book.setId(id);
        book.setBorrowed(false);
        book.setBorrowedBy(null);
        book.setDueDate(null);
        bookDatabase.put(id, book);
        return ResponseEntity.status(HttpStatus.CREATED).body(book);
    }

    // Delete a book
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        if (!bookDatabase.containsKey(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        bookDatabase.remove(id);
        return ResponseEntity.noContent().build();
    }

    // Borrow a book
    @PostMapping("/{id}/borrow")
    public ResponseEntity<?> borrowBook(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        Book book = bookDatabase.get(id);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Book not found"));
        }
        if (book.isBorrowed()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Book is already borrowed"));
        }

        String studentName = requestBody.get("borrowedBy");
        if (studentName == null || studentName.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Borrower name is required"));
        }

        book.setBorrowed(true);
        book.setBorrowedBy(studentName.trim());
        book.setDueDate(LocalDate.now().plusWeeks(2)); // Borrow period: 2 weeks
        bookDatabase.put(id, book);

        return ResponseEntity.ok(book);
    }

    // Return a book
    @PostMapping("/{id}/return")
    public ResponseEntity<?> returnBook(@PathVariable Long id) {
        Book book = bookDatabase.get(id);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Book not found"));
        }
        if (!book.isBorrowed()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Book is not borrowed"));
        }

        book.setBorrowed(false);
        book.setBorrowedBy(null);
        book.setDueDate(null);
        bookDatabase.put(id, book);

        return ResponseEntity.ok(book);
    }
}
