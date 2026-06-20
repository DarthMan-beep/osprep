FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY CatalogViewer.java .
COPY products.txt .
RUN javac CatalogViewer.java
# TODO: set ENV PRODUCT_FILE_PATH and run the app with CMD
