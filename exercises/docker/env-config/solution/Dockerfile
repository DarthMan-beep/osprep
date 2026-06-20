FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY CatalogViewer.java .
COPY products.txt .
RUN javac CatalogViewer.java
ENV PRODUCT_FILE_PATH=/app/products.txt
CMD ["java", "CatalogViewer"]
