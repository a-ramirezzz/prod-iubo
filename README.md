# Prod-UIBO: Reloj de Productividad Inteligente

![Prod-UIBO Logo](src/app/prod-iubo.png) Prod-UIBO es una aplicación web diseñada para ayudarte a maximizar tu productividad y gestionar tu tiempo de manera eficaz. Ofrece un temporizador de cuenta regresiva altamente personalizable con una interfaz limpia, moderna y enfocada en el usuario.

## ✨ Características Principales

* **Temporizador Personalizable:** Configura el reloj para cualquier duración, desde minutos hasta 72 horas.
* **Visualización Clara:** Muestra el tiempo restante en formato `HH:MM:SS` de forma prominente.
* **Presets de Tiempo Rápido:** Botones para iniciar rápidamente sesiones de productividad de 20, 30, 45 o 60 minutos.
* **Entrada de Tiempo Detallada:**
    * Permite ingresar horas (hasta 72) y minutos (hasta 59) de forma manual.
    * Validación integrada para asegurar que los tiempos ingresados sean correctos.
* **Controles Completos del Temporizador:**
    * Iniciar
    * Pausar / Reanudar
    * Reiniciar (al último tiempo configurado)
    * Detener (resetea el temporizador a cero)
* **Diseño Responsivo:** Interfaz adaptable que funciona de manera óptima en computadoras de escritorio, tabletas y dispositivos móviles.
* **Tema Oscuro Elegante:** Paleta de colores oscuros (negro, grises y blanco) para una menor fatiga visual y un aspecto moderno, con toques de color en la marca (rojo y azul para "Prod-UIBO").
* **Animación Dinámica:** Los segundos cambian de forma fluida y visualmente agradable.
* **Identidad de Marca:** Nombre del proyecto "Prod-UIBO" visible en la interfaz.
* **Optimización SEO Básica:** Metadata y favicon configurados para una mejor indexación y reconocimiento.
* **Gestión de Tareas con Drag & Drop:** Sistema completo de objetivos diarios con capacidad de reordenar tareas mediante arrastrar y soltar.

## 🍅 La Técnica Pomodoro

Prod-UIBO está inspirado en la **Técnica Pomodoro**, un método de gestión del tiempo diseñado para mejorar el enfoque y la productividad. La técnica consiste en trabajar en intervalos concentrados de 25 minutos (llamados "pomodoros"), seguidos de un breve descanso de 5 minutos.

Para facilitar la inmersión durante estos intervalos, Prod-UIBO te permite personalizar tu entorno con una variedad de **temas visuales** y **sonidos ambientales**, ayudándote a crear el espacio de concentración perfecto para ti.

Este método es especialmente útil tanto para perfeccionistas como para procrastinadores, ya que divide grandes tareas en bloques manejables. Sus principales beneficios son:

*   **Mejora la concentración:** Ayuda a mantener la mente fresca y enfocada.
*   **Minimiza las distracciones:** Fomenta un entorno de trabajo sin interrupciones.
*   **Previene el agotamiento:** Los descansos regulares evitan la fatiga mental.
*   **Fomenta la responsabilidad:** Facilita el seguimiento del tiempo dedicado a cada tarea.
*   **Aumenta la motivación:** Es más fácil comprometerse a trabajar 25 minutos que enfrentar una tarde entera de trabajo sin parar.

## 🚀 Tecnologías Utilizadas

* **Next.js (v13+ con App Router):** Framework de React para aplicaciones web modernas y optimizadas.
* **React (v18+):** Biblioteca de JavaScript para construir interfaces de usuario.
* **TypeScript:** Superset de JavaScript que añade tipado estático para un desarrollo más robusto.
* **CSS Modules:** Para estilos encapsulados y específicos por componente, evitando colisiones de nombres.
* **HTML5 & CSS3:** Estándares web para la estructura y el diseño.
* **@dnd-kit:** Librería moderna para funcionalidad de arrastrar y soltar (drag & drop).

## 🛠️ Instalación y Puesta en Marcha Local

Sigue estos pasos para tener una copia del proyecto corriendo en tu máquina local para desarrollo y pruebas.

### Prerrequisitos

* Node.js (versión 18.x o superior recomendada)
* npm (usualmente viene con Node.js) o yarn

### Pasos

1.  **Clona el Repositorio:**
    ```bash
    git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
    cd TU_REPOSITORIO
    ```
    *(Reemplaza `TU_USUARIO/TU_REPOSITORIO` con la URL real de tu repositorio en GitHub)*

2.  **Instala las Dependencias:**
    Si usas npm:
    ```bash
    npm install
    ```
    Si usas yarn:
    ```bash
    yarn install
    ```
    
    **Nota:** El proyecto incluye dependencias adicionales para funcionalidad de drag & drop que se instalan automáticamente con el comando anterior.

3.  **Ejecuta el Servidor de Desarrollo:**
    Si usas npm:
    ```bash
    npm run dev
    ```
    Si usas yarn:
    ```bash
    yarn dev
    ```

4.  **Abre la Aplicación:**
    Abre tu navegador web y visita `http://localhost:3000`. Deberías ver la aplicación Prod-UIBO en funcionamiento.

## 📋 Gestión de Tareas

Prod-UIBO incluye un sistema completo de gestión de objetivos diarios:

* **Modal de Objetivos:** Interfaz dedicada para crear y gestionar tareas de la sesión
* **Barra de Progreso Dinámica:** Visualización del progreso con colores que cambian según el porcentaje completado
* **Drag & Drop:** Reordena tus tareas arrastrando el handle (⋮⋮) de cada tarea
* **Efecto de Celebración:** Animación especial con emojis de fuego 🔥 al completar el 100% de objetivos
* **Persistencia:** Las tareas se mantienen durante la sesión de trabajo

## 📁 Estructura del Proyecto (Simplificada)

El proyecto sigue una estructura organizada para facilitar el mantenimiento y la escalabilidad:
