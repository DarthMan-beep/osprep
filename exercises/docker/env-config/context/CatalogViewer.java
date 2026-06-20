import java.io.*;

public class CatalogViewer {

    public static void main(String[] args) {
        String path = System.getenv("PRODUCT_FILE_PATH");

        if (path == null) {
            throw new RuntimeException("Environment variable PRODUCT_FILE_PATH is not set!");
        }

        try (BufferedReader reader =
                     new BufferedReader(new InputStreamReader(new FileInputStream(path)))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] cells = line.split(";");
                if (cells.length != 3) {
                    throw new RuntimeException("Invalid row!");
                }
                System.out.printf("Product Name: %s%n", cells[0]);
                System.out.printf("Product Price: %s%n", cells[1]);
                System.out.printf("Product Quantity: %s%n", cells[2]);
                System.out.println();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
