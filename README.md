# Readsphere - Library Management System

A premium, responsive, and lightweight **Library Management System** web application designed to demonstrate robust build pipelines with **Maven**, containerization using **Docker**, and continuous integration through **GitHub Actions**.

---

## 🛠️ Technology Stack & Architecture

- **Backend**: Spring Boot 3.2.5 (Java 17)
  - Uses in-memory concurrent data repositories for fast, self-contained operation without external database configuration overhead.
  - REST endpoints for adding, searching, borrowing, returning, and deleting books.
- **Frontend**: Dynamic Single Page Application (SPA)
  - Styled with custom CSS, Poppins/Outfit typography, glassmorphism, responsive grid layouts, and active element state transitions.
  - Connected using async Javascript FETCH API with elegant, interactive visual toasts.
- **Packaging & Containerization**: Multi-stage `Dockerfile` running on lightweight alpine JRE images and locked down via a secure, non-root user execution context.
- **CI/CD**: GitHub Actions workflow supporting JDK setup, Maven dependency caching, automated unit/integration test suites, and Docker image build verifications.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have the following installed:
- **Java 17 JDK** (e.g., Eclipse Temurin)
- **Maven 3.x+**
- **Docker Engine** (or Docker Desktop)
- **Git**

---

### 2. Running Locally with Maven

You can build and run the application locally outside of Docker:

#### Build & Run Tests:
```bash
mvn clean test
```

#### Compile and Launch the Web Server:
```bash
mvn spring-boot:run
```

Once started, open your browser and navigate to:
👉 **[http://localhost:8080](http://localhost:8081)**

---

### 3. Containerizing & Running with Docker

This project utilizes a **multi-stage build** which means you do not need Maven or Java installed on your machine to build the container; Docker handles the build environment and JRE compilation entirely inside isolation.

#### Build the Docker Image:
```bash
docker build -t library-management-system:1.0.0 .
```

#### Spin Up the Container:
```bash
docker run -d -p 8080:8080 --name library-app library-management-system:1.0.0
```

#### Check Status & Logs:
```bash
docker ps
docker logs -f library-app
```

Navigate to **[http://localhost:8080](http://localhost:8081)** to interact with your secure, containerized library instance.

#### Stop the Container:
```bash
docker stop library-app
docker rm library-app
```

---

## 🧪 Testing Coverage

The application includes automated integration test suites (`LibraryApplicationTests.java`) verifying:
- Successful context initialization.
- Book catalog retrieval (`GET /api/books`).
- Input validation verification (invalid entries return HTTP 400 Bad Request).
- State transitions: borrowing and returning processes, blocking duplicate borrows, and catalog updates.

Run the test suite using:
```bash
mvn test
```

---

## ⚙️ CI/CD Pipeline (GitHub Actions)

The pipeline is defined in `.github/workflows/ci.yml`.

Whenever you push code to `main` or open a Pull Request, GitHub Actions will:
1. Spin up an `ubuntu-latest` builder environment.
2. Check out your code.
3. Boot up JDK 17.
4. Restores your custom Maven package cache (ensuring super fast subsequent runs).
5. Runs the entire unit/integration test suite.
6. Automatically runs the multi-stage Docker build to verify that the Dockerfile remains compile-ready and secure.
