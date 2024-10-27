// des que la page se charge ou reload =>
    document.addEventListener("DOMContentLoaded", () => {
        // URL de l'API et clé publique
        const API_URL = "https://dashing-sweet-spinach.glitch.me";
        const API_KEY = "Yzgse498OGytU07Csa9Q7rykmXUvT65CQ1F9eu35QOtspQTwulFHePkxuOepOqzp";
    
        // Configurer axios avec les paramètres de base (URL de l'API + clé)
        axios.defaults.baseURL = API_URL;
        axios.defaults.params = { key: API_KEY };
        
        // Initialisation des variables (liste des classes, classe actuelle, étudiants passés)
        let classrooms = [];
        let currentClassId = null;
        let passedStudents = JSON.parse(localStorage.getItem("passedStudents")) || {};
    
        // Sélection des éléments DOM (formulaires, boutons, sections) pour ajouter des événements
        const addClassForm = document.getElementById("addClassForm");
        const classSelector = document.getElementById("classSelector");
        const deleteClassBtn = document.getElementById("deleteClassBtn");
        const addClassSection = document.getElementById("addClassSection");
        const studentSection = document.getElementById("studentSection");
        const studentForm = document.getElementById("studentForm");
        const studentList = document.getElementById("studentList");
        const soutenanceSection = document.getElementById("soutenanceSection");
        const randomStudentBtn = document.getElementById("randomStudentBtn");
        const statusMessage = document.getElementById("statusMessage");
        const resetBtn = document.getElementById("resetBtn");
    
        // Charger les classes existantes au démarrage
        getClassrooms();
        toggleAddClassSection();
    
        // Fonction pour afficher/masquer la section "ajouter une classe" selon sélection
        function toggleAddClassSection() {
            if (classSelector.value === "") {
                addClassSection.classList.remove("hidden");
            } else {
                addClassSection.classList.add("hidden");
            }
        }
    
        // Récupérer les classes avec Axios et les afficher
        function getClassrooms() {
            axios.get("/classrooms")
                .then(response => {
                    classrooms = Array.isArray(response.data) ? response.data : [];
                    updateClassSelector();
        
                    // Afficher le message "Aucune classe pour le moment" si aucune classe n'existe
                    const noClassesMessage = document.getElementById("noClassesMessage");
                    if (classrooms.length === 0) {
                        noClassesMessage.classList.remove("hidden");
                    } else {
                        noClassesMessage.classList.add("hidden");
                    }
                })
                .catch(error => console.error("Erreur lors du chargement des classes :", error));
        }
        
    
        // Gestionnaire d'événement pour ajouter une nouvelle classe
        addClassForm.addEventListener("submit", event => {
            event.preventDefault();
            const classNameInput = document.getElementById("classNameInput");
            const className = classNameInput.value.trim();
    
            // Réinitialiser les erreurs d'entrée si elles existent
            classNameInput.classList.remove("input-error");
            const existingErrorMessage = document.querySelector(".error-message");
            if (existingErrorMessage) existingErrorMessage.remove();
    
            // Envoi des données pour ajouter la classe
            axios.post("/classrooms", { name: className })
                .then(response => {
                    if (!Array.isArray(classrooms)) classrooms = [];
    
                    const newClass = { ...response.data, students: [] };
                    classrooms.push(newClass);
                    updateClassSelector();
    
                    // Sélection automatique de la nouvelle classe
                    if (newClass._id) {
                        currentClassId = newClass._id;
                        classSelector.value = currentClassId;
                        selectClass();
                    } else {
                        console.error("Erreur: L'ID de la classe nouvellement créée est manquant.");
                    }
    
                    // Réinitialiser le champ de saisie et cacher la section d'ajout
                    classNameInput.value = "";
                    addClassSection.classList.add("hidden");
    
                    // Réinitialiser les étudiants passés dans le localStorage pour la nouvelle classe
                    passedStudents = {};
                    localStorage.setItem("passedStudents", JSON.stringify(passedStudents));
                })
                .catch(error => {
                    if (error.response && error.response.status === 409) {
                        classNameInput.classList.add("input-error");
                        const errorMessage = document.createElement("p");
                        errorMessage.classList.add("error-message");
                        errorMessage.textContent = "Le nom de cette classe existe déjà.";
                        addClassForm.appendChild(errorMessage);
                    } else {
                        console.error("Erreur lors de l'ajout de la classe :", error);
                    }
                });
        });
        
        // Mise à jour des options de classes dans le selecteur
        function updateClassSelector() {
            classSelector.innerHTML = "<option value=''>Choisir une classe</option>";
            classrooms.forEach(classroom => {
                const option = document.createElement("option");
                option.value = classroom._id;
                option.textContent = classroom.name;
                classSelector.appendChild(option);
            });
    
            if (!classSelector.hasAttribute("data-listener")) {
                classSelector.addEventListener("change", () => {
                    toggleAddClassSection();
                    selectClass();
                });
                classSelector.setAttribute("data-listener", "true");
            }
        }
    
        // Suppression de la classe sélectionnée
        deleteClassBtn.addEventListener("click", () => {
            axios.delete(`/classrooms/${currentClassId}`)
                .then(() => {
                    classrooms = classrooms.filter(c => c._id !== currentClassId);
                    currentClassId = null;
    
                    studentSection.classList.add("hidden");
                    updateClassSelector();
                    toggleAddClassSection();
                })
                .catch(error => console.error("Erreur lors de la suppression de la classe :", error));
        });
    
        // Sélection d'une classe et chargement de ses étudiants
        function selectClass() {
            currentClassId = classSelector.value;
            studentSection.classList.toggle("hidden", !currentClassId);
            soutenanceSection.classList.toggle("hidden", !currentClassId);
            if (currentClassId) loadStudents(currentClassId);
        }
    
        // Chargement des étudiants de la classe avec Axios
        function loadStudents(classId) {
            axios.get(`/classrooms/${classId}/students`)
                .then(response => {
                    const data = response.data;
                    if (Array.isArray(data.students) && data.students.length === 0) {
                        studentList.innerHTML = "<li class='text-gray-400'>Aucun étudiant trouvé pour cette classe.</li>";
                    } else {
                        classrooms.find(c => c._id === classId).students = data;
                        updateStudentList();
                    }
                })
                .catch(error => {
                    console.error("Erreur lors du chargement des étudiants :", error);
                });
        }
    
        // Ajout d'un étudiant dans la classe actuelle
        studentForm.addEventListener("submit", event => {
            event.preventDefault();
            const studentNameInput = document.getElementById("studentName");
            const studentName = studentNameInput.value.trim();
    
            studentNameInput.classList.remove("input-error");
            const existingErrorMessage = document.querySelector(".error-message");
            if (existingErrorMessage) existingErrorMessage.remove();
    
            axios.post(`/classrooms/${currentClassId}/students`, { name: studentName })
                .then(response => {
                    classrooms.find(c => c._id === currentClassId).students.push(response.data.student);
                    updateStudentList();
                    studentNameInput.value = "";  // Réinitialiser le champ après ajout
                })
                .catch(error => {
                    if (error.response && error.response.status === 409) {
                        studentNameInput.classList.add("input-error");
                        const errorMessage = document.createElement("p");
                        errorMessage.classList.add("error-message");
                        errorMessage.textContent = "L'étudiant existe déjà dans cette classe.";
                        studentForm.appendChild(errorMessage);
                    } else {
                        console.error("Erreur lors de l'ajout de l'étudiant :", error);
                    }
                });
        });
    
        // Mise à jour de la liste des étudiants affichés
        function updateStudentList() {
            studentList.innerHTML = "";
            const classroom = classrooms.find(c => c._id === currentClassId);
            classroom.students.forEach(student => addStudentToDOM(student));
        }
    
        // Ajouter un étudiant au DOM avec boutons d'édition et de suppression
        function addStudentToDOM(student) {
            const studentItem = document.createElement("li");
            studentItem.classList.add("list-etu", "p-4", "rounded-md", "border", "flex", "items-center", "justify-between");
            
            // Élément pour le nom de l'étudiant
            const studentName = document.createElement("span");
            studentName.textContent = student.name;
            
            if (passedStudents[currentClassId] && passedStudents[currentClassId].includes(student._id)) {
                studentItem.classList.add("passed-student");
            }
        
            // Conteneur pour les boutons
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("flex", "space-x-2");
            
            const editButton = document.createElement("span");
            editButton.classList.add("action-btn");
            editButton.textContent = "✏️";
            editButton.onclick = () => editStudent(student);
            
            const deleteButton = document.createElement("span");
            deleteButton.classList.add("action-btn");
            deleteButton.textContent = "🗑️";
            deleteButton.onclick = () => deleteStudent(student._id);
            
            // Ajout des boutons dans le conteneur
            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);
            
            // Ajout du nom de l'étudiant et des boutons à la liste
            studentItem.appendChild(studentName);
            studentItem.appendChild(buttonContainer);
            
            studentList.appendChild(studentItem);
        }
        
    
        // Suppression d'un étudiant avec message de succès
        function deleteStudent(studentId) {
            axios.delete(`/classrooms/${currentClassId}/students/${studentId}`)
                .then(() => {
                    classrooms.find(c => c._id === currentClassId).students = classrooms.find(c => c._id === currentClassId).students.filter(s => s._id !== studentId);
                    updateStudentList();
    
                    const statusMessage = document.getElementById("statusMessage");
                    statusMessage.textContent = "Étudiant supprimé avec succès !";
                    statusMessage.classList.remove("text-gray-300");
                    statusMessage.classList.add("text-green-500");
                })
                .catch(error => console.error("Erreur lors de la suppression de l'étudiant :", error));
        }
    
        // Fonction d'édition d'un étudiant
        function editStudent(student) {
            const newName = prompt("Modifier le nom de l'étudiant :", student.name);
            if (newName && newName.trim() !== student.name) {
                axios.put(`/classrooms/${currentClassId}/students/${student._id}`, { name: newName.trim() })
                    .then(() => {
                        student.name = newName.trim();
                        updateStudentList();
    
                        const statusMessage = document.getElementById("statusMessage");
                        statusMessage.textContent = "Étudiant modifié avec succès !";
                        statusMessage.classList.remove("text-red-500");
                        statusMessage.classList.add("text-green-500");
                    })
                    .catch(error => {
                        if (error.response && error.response.status === 409) {
                            const statusMessage = document.getElementById("statusMessage");
                            statusMessage.textContent = "Le nom de l'étudiant existe déjà dans cette classe.";
                            statusMessage.classList.remove("text-green-500");
                            statusMessage.classList.add("text-red-500");
                        } else {
                            console.error("Erreur lors de la modification de l'étudiant :", error);
                        }
                    });
            }
        }
    
        // Appeler un étudiant au hasard
        randomStudentBtn.addEventListener("click", () => {
            const classroom = classrooms.find(c => c._id === currentClassId);
            if (!classroom) return;
    
            const remainingStudents = classroom.students.filter(s => !passedStudents[currentClassId] || !passedStudents[currentClassId].includes(s._id));
    
            if (remainingStudents.length === 0) {
                statusMessage.textContent = "Tous les étudiants de cette classe sont déjà passés.";
                statusMessage.classList.add("text-red-500");
                return;
            }
    
            const randomIndex = Math.floor(Math.random() * remainingStudents.length);
            const selectedStudent = remainingStudents[randomIndex];
            statusMessage.textContent = "Étudiant appelé : ";
            const strongElement = document.createElement("strong");
            strongElement.textContent = selectedStudent.name;
            statusMessage.appendChild(strongElement);
    
            if (!passedStudents[currentClassId]) {
                passedStudents[currentClassId] = [];
            }
            passedStudents[currentClassId].push(selectedStudent._id);
            localStorage.setItem("passedStudents", JSON.stringify(passedStudents));
            updateStudentList();
        });
    
        // Réinitialiser les étudiants passés
        resetBtn.addEventListener("click", () => {
            if (currentClassId && classrooms.find(c => c._id === currentClassId)) {
                passedStudents[currentClassId] = [];
                localStorage.setItem("passedStudents", JSON.stringify(passedStudents));
    
                statusMessage.textContent = "Tous les étudiants ont été réinitialisés.";
                statusMessage.classList.remove("text-red-500");
                statusMessage.classList.add("text-gray-300");
    
                updateStudentList();
            } else {
                alert("Aucune classe sélectionnée pour réinitialiser les étudiants.");
            }
        });
    });
    