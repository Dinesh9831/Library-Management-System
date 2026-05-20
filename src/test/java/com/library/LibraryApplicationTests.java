package com.library;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LibraryApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
        // Verifies that the Spring container starts successfully
    }

    @Test
    void testGetAllBooks() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$[0].title", notNullValue()))
                .andExpect(jsonPath("$[0].author", notNullValue()));
    }

    @Test
    void testAddBookSuccess() throws Exception {
        String newBookJson = """
                {
                    "title": "Clean Architecture",
                    "author": "Robert C. Martin",
                    "isbn": "978-0134494166"
                }
                """;

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newBookJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Clean Architecture")))
                .andExpect(jsonPath("$.borrowed", is(false)));
    }

    @Test
    void testAddBookValidationError() throws Exception {
        String invalidBookJson = """
                {
                    "title": "",
                    "author": "Nobody",
                    "isbn": "123"
                }
                """; // Empty title and too short ISBN

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBookJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testBorrowAndReturnBook() throws Exception {
        // 1. Borrow a book (ID 1 is pre-populated as 'Clean Code')
        String borrowRequest = """
                {
                    "borrowedBy": "Alice Smith"
                }
                """;

        mockMvc.perform(post("/api/books/1/borrow")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(borrowRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.borrowed", is(true)))
                .andExpect(jsonPath("$.borrowedBy", is("Alice Smith")))
                .andExpect(jsonPath("$.dueDate", notNullValue()));

        // 2. Try to borrow the same book again (should fail)
        mockMvc.perform(post("/api/books/1/borrow")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(borrowRequest))
                .andExpect(status().isBadRequest());

        // 3. Return the book
        mockMvc.perform(post("/api/books/1/return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.borrowed", is(false)))
                .andExpect(jsonPath("$.borrowedBy", nullValue()))
                .andExpect(jsonPath("$.dueDate", nullValue()));
    }
}
