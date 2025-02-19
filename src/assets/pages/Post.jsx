
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Modal, Form, Card, Container, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";

const OnlineMart = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: "", price: "", image: "" });
  const queryClient = useQueryClient();

  // Fetch products
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("https://dummyjson.com/products");
      const result = await res.json();
      return result.products;
    },
  });

  // Create Product
  const createMutation = useMutation({
    mutationFn: async ({ title, price, image }) => {
      return {
        id: Date.now(), // Temporary ID
        title,
        price,
        thumbnail: image || "https://via.placeholder.com/150", // Ensure image is set
      };
    },
    onSuccess: (newProduct) => {
      queryClient.setQueryData(["products"], (prev) => [newProduct, ...prev]);
      setShowCreateForm(false);
      setNewProduct({ title: "", price: "", image: "" });
    },
  });

  // Delete Product
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await fetch(`https://dummyjson.com/products/${productId}`, {
        method: "DELETE",
      });
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.setQueryData(["products"], (prev) => prev.filter((p) => p.id !== productId));
    },
  });

  // Update Product
  const updateMutation = useMutation({
    mutationFn: async ({ productId, title, price, image }) => {
      return {
        id: productId,
        title,
        price,
        thumbnail: image || "https://via.placeholder.com/150",
      };
    },
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(["products"], (prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    },
  });

  if (isPending) return <h1>Loading...</h1>;
  if (isError) return <h1>Error: {error.message}</h1>;

  return (
    <>
      <Button variant="success" className="m-3" onClick={() => setShowCreateForm(true)}>
        Add Product
      </Button>

      {/* Create Product Modal */}
      <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newProduct);
            }}
          >
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">Add</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Product Cards */}
      <Container>
        <Row className="g-4">
          {data?.map(({ id, title, price, thumbnail }) => (
            <Col key={id} xs={12} sm={6} md={4} lg={3}>
              <Card className="shadow-sm p-3 mb-3 rounded">
                <Card.Img
                  variant="top"
                  src={thumbnail || "https://via.placeholder.com/150"}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <Card.Body>
                  <Card.Title>{title}</Card.Title>
                  <Card.Text>Price: ${price}</Card.Text>
                  {/* <Button
                    variant="secondary"
                    className="m-1"
                    onClick={() => {
                      const newTitle = prompt("Enter new title:", title);
                      const newPrice = prompt("Enter new price:", price);
                      const newImage = prompt("Enter new image URL:", thumbnail);
                      if (newTitle !== null && newPrice !== null && newImage !== null) {
                        updateMutation.mutate({ productId: id, title: newTitle, price: newPrice, image: newImage });
                      }
                    }}
                  >
                    Update
                  </Button> */}
                  <Button
  variant="secondary"
  className="m-1"
  onClick={() => {
    Swal.fire({
      title: "Update Product",
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Title" value="${title}">
        <input id="swal-price" type="number" class="swal2-input" placeholder="Price" value="${price}">
        <input id="swal-image" class="swal2-input" placeholder="Image URL" value="${thumbnail}">
      `,
      showCancelButton: true,
      confirmButtonText: "Update",
      preConfirm: () => {
        const newTitle = document.getElementById("swal-title").value;
        const newPrice = document.getElementById("swal-price").value;
        const newImage = document.getElementById("swal-image").value;
        if (!newTitle || !newPrice || !newImage) {
          Swal.showValidationMessage("All fields are required");
          return false;
        }
        return { newTitle, newPrice, newImage };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateMutation.mutate({
          productId: id,
          title: result.value.newTitle,
          price: result.value.newPrice,
          image: result.value.newImage,
        });
        Swal.fire("Updated!", "Your product has been updated.", "success");
      }
    });
  }}
>
  Update
</Button>

                  <Button variant="danger" className="m-1" onClick={() => deleteMutation.mutate(id)}>
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default OnlineMart;
