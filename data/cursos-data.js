import Category from "../model/category.js ";
import Course from "../model/course.js ";

export const categorias = [
    new Category(1, "Pilates"),
    new Category(2, "Yoga"),
    new Category(3, "Entrenamiento Funcional")
];              

export const clases = [
    new Course(1, "Clase de pilates", "Mejora tu flexibilidad y fuerza con pilates.", "1 hora", "Principiante"),                                                                                                                                                                            
    new Course(2, "Clase de yoga", "Relájate y encuentra tu equilibrio con yoga.", "1 hora", "Intermedio"),
    new Course(3, "Clase de entrenamiento funcional", "Entrena todo tu cuerpo con ejercicios funcionales.", "1 hora", "Avanzado")
];
export const cursos = [
    new Course(1, "Curso de pilates", "Mejora tu flexibilidad y fuerza con pilates.", "4 semanas", "Principiante"),
    new Course(2, "Curso de yoga", "Relájate y encuentra tu equilibrio con yoga.", "4 semanas", "Intermedio"),
    new Course(3, "Curso de entrenamiento funcional", "Entrena todo tu cuerpo con ejercicios funcionales.", "4 semanas", "Avanzado")
];           
export const cursosPorCategoria = {
    1: [cursos[0]], // Cursos de Pilates
    2: [cursos[1]], // Cursos de Yoga
    3: [cursos[2]]  // Cursos de Entrenamiento Funcional
};      