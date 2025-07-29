import { useState } from "react";
import { Box, Button, MenuItem, TextField, CircularProgress } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import api from "../../axiosConfig"; 

const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFormSubmit = async (values, { resetForm, setSubmitting }) => {
    console.log("Données envoyées :", values);
    setIsLoading(true);
    setErrorMessage("");
    try {
      await api.post("/users/", values);
      alert("Utilisateur créé avec succès !");
      resetForm();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       "Une erreur est survenue lors de la création de l'utilisateur.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };


  return (
    <Box m="20px" maxWidth="800px" mx="auto">
      <Header title="CRÉER UN AGENT" subtitle="Créer un nouveau profil d'agent" />

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          resetForm, // Destructure resetForm here
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                "& .MuiTextField-root": { mb: 1 },
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                type="text"
                label="Nom d'utilisateur"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.username}
                name="username"
                error={!!touched.username && !!errors.username}
                helperText={touched.username && errors.username}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="outlined"
                type="email"
                label="Email"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                name="email"
                error={!!touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="outlined"
                type="password"
                label="Mot de passe"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                name="password"
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                select
                fullWidth
                variant="outlined"
                label="Spécialité"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.specialty}
                name="specialty"
                error={!!touched.specialty && !!errors.specialty}
                helperText={touched.specialty && errors.specialty}
                sx={{ gridColumn: "span 4" }}
              >
                {specialties.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {errorMessage && (
              <Box mt={2} color="error.main">
                {errorMessage}
              </Box>
            )}

            <Box display="flex" justifyContent="end" mt="20px" gap={2}>
              <Button
                type="button"
                color="inherit"
                variant="outlined"
                onClick={() => resetForm()} // Now resetForm is defined
                disabled={isSubmitting || isLoading}
              >
                Réinitialiser
              </Button>
              <Button
                type="submit"
                color="secondary"
                variant="contained"
                disabled={isSubmitting || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Création..." : "Créer l'agent"}
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

const specialties = [
  { value: "jardinier", label: "Jardinier" },
  { value: "paysagiste", label: "Paysagiste" },
  { value: "horticulteur", label: "Horticulteur" },
  { value: "electronicien", label: "Électronicien" },
  { value: "technicien_iot", label: "Technicien IoT" },
  { value: "installateur_capteurs", label: "Installateur de capteurs" },
  { value: "maintenance", label: "Agent de maintenance" },
  { value: "irrigation", label: "Spécialiste irrigation" },
  { value: "gestion_energie", label: "Gestion de l’énergie" },
  { value: "autre", label: "Autre" },
];

const validationSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup
    .string()
    .email("Adresse email invalide")
    .required("Email requis"),
  password: yup
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Doit contenir au moins une majuscule, une minuscule et un chiffre"
    )
    .required("Mot de passe requis"),
  specialty: yup.string().required("Spécialité requise"),
});

const initialValues = {
  username: "",
  email: "",
  password: "",
  specialty: "autre",
};

export default Form;