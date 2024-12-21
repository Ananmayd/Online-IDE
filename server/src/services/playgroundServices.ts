import fs from "fs";
import path from "path";

const templatesDir = path.join(__dirname, "../../../templates");

export const createPlaygroundFromTemplate = async (userId: string, playgroundId: string, language: string) => {
  const userPlaygroundDir = path.join(__dirname, "../../../user-Playgrounds", `user_${userId}`, `playground_${playgroundId}`);
  
  // Ensure the user's playground directory exists
  fs.mkdirSync(userPlaygroundDir, { recursive: true });
  
  // Path to the selected language template folder
  const templatePath = path.join(templatesDir, language);

  // Copy each file from the template to the user's playground directory
  fs.readdirSync(templatePath).forEach((file) => {
    const sourceFile = path.join(templatePath, file);
    const destFile = path.join(userPlaygroundDir, file);
    fs.copyFileSync(sourceFile, destFile);
  });

  // console.log(`Playground created for user ${userId} with language ${language}`);
};
