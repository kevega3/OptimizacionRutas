import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  IconButton,
  CircularProgress,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";

// Create a theme with blue, white, gray, and black colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#424242",
    },
  },
});

function App() {
  // State for route inputs
  const [routes, setRoutes] = useState([""]);
  // State for current input validation
  const [inputErrors, setInputErrors] = useState([false]);
  // State for chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      role: "system",
      content:
        "Bienvenido a la aplicación de optimización de rutas. Ingresa tus direcciones y te ayudaré a encontrar la ruta óptima.",
    },
  ]);
  // Loading state
  const [loading, setLoading] = useState(false);
  // Error state
  const [error, setError] = useState(null);

  // Function to validate input
  const validateInput = (input) => {
    const illegalChars = ["@", "%", "&", '"', "'", "/", "(", ")", "¿", ";"];
    return (
      !illegalChars.some((char) => input.includes(char)) && input.trim() !== ""
    );
  };

  // Handle input change
  const handleInputChange = (index, value) => {
    const newRoutes = [...routes];
    newRoutes[index] = value;
    setRoutes(newRoutes);

    // Validate input
    const newInputErrors = [...inputErrors];
    newInputErrors[index] = value.trim() !== "" && !validateInput(value);
    setInputErrors(newInputErrors);
  };

  // Add new route input
  const addRouteInput = () => {
    setRoutes([...routes, ""]);
    setInputErrors([...inputErrors, false]);
  };

  // Remove route input
  const removeRouteInput = (index) => {
    if (routes.length > 1) {
      const newRoutes = routes.filter((_, i) => i !== index);
      const newInputErrors = inputErrors.filter((_, i) => i !== index);
      setRoutes(newRoutes);
      setInputErrors(newInputErrors);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all inputs
    const allValid = routes.every(
      (route, index) => route.trim() !== "" && !inputErrors[index]
    );

    if (!allValid) {
      setError("Por favor, corrige los campos con errores antes de enviar.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Add user message to chat
    const userMessage = {
      role: "user",
      content:
        "Necesito optimizar esta ruta: " +
        routes.map((route) => `- ${route}`).join(" "),
    };

    setChatMessages([...chatMessages, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Create prompt for OpenAI
      const prompt = `Dada la siguiente lista de destinos: ${routes
        .map((route) => `– ${route}`)
        .join(
          " "
        )} Indica la ruta óptima para llegar a todos los destinos de manera eficiente, organizando el orden de visita de forma sencilla y sin introducciones innecesarias.`;

      // Call OpenAI API
      const response = await fetch(
        "https://openaicacllm.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "api-key": process.env.REACT_APP_OPENAI_API_KEY,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            top_p: 0.95,
            max_tokens: 800,
          }),
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        console.log(data.choices[0].message.content);

        // Add AI response to chat
        setChatMessages([
          ...chatMessages,
          userMessage,
          { role: "assistant", content: aiResponse },
        ]);
      } else {
        setError(
          "En este momento no se puede obtener ayuda. Por favor, intenta más tarde."
        );
      }
    } catch (error) {
      setError(
        "En este momento no se puede obtener ayuda. Por favor, intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (index === routes.length - 1) {
        // If it's the last input, add a new one or submit if it's valid
        if (validateInput(routes[index]) && routes[index].trim() !== "") {
          handleSubmit(e);
        } else {
          addRouteInput();
        }
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: "center" }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            Optimizador de Rutas
          </Typography>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Ingresa tus direcciones y te ayudaremos a encontrar la ruta más
            eficiente
          </Typography>
        </Box>

        {/* Chat messages */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            height: "400px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {chatMessages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                p: 2,
                borderRadius: 2,
                bgcolor: message.role === "user" ? "primary.light" : "grey.100",
                color: message.role === "user" ? "white" : "text.primary",
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </Paper>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Input form */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            {routes.map((route, index) => (
              <Box
                key={index}
                sx={{ display: "flex", mb: 2, alignItems: "center" }}
              >
                <TextField
                  fullWidth
                  label={`Dirección ${index + 1}`}
                  variant="outlined"
                  value={route}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  error={inputErrors[index]}
                  helperText={
                    inputErrors[index]
                      ? "La dirección contiene caracteres no permitidos (@, %, &, \", ', /, (, ), 0, ¿, ;)"
                      : ""
                  }
                  sx={{ mr: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeRouteInput(index)}
                  disabled={routes.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addRouteInput}
              >
                Agregar ruta
              </Button>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                type="submit"
                disabled={
                  loading ||
                  routes.some(
                    (route, index) => route.trim() === "" || inputErrors[index]
                  )
                }
              >
                Enviar
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;

// import logo from "./logo.svg";
// import "./App.css";

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
