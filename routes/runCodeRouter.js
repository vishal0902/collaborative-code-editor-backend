import axios from "axios";
import dotenv from 'dotenv'
import express from "express";
dotenv.config();

const runCodeRouter = express.Router();


runCodeRouter.post("/run", async (req, res) => {
  const JUDGE0_URL = process.env.JUDGE0_URL;
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY

  const { language, code, stdin } = req.body;
  console.log(code, language);
  

    const languageMap = {
      javascript: 63, // Node.js 18.x
      python: 71, // Python 3.11.2
      cpp: 54, // C++ (GCC 9.2.0)
    };

    const languageId = languageMap[language] || 63; 


  const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions',
  params: {
    base64_encoded: 'false',
    wait: 'true',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': JUDGE0_API_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    language_id: languageId,
    source_code: code,
    stdin: ''
  }
};
  

try {
	const response = await axios.request(options);
	const token = response.data.token;

    let result;
    let status = "In Queue";

    while (status === "In Queue" || status === "Processing") {
      
      const options = {
        method: 'GET',
        url: `${JUDGE0_URL}/submissions/${token}`,
        params: {
          base64_encoded: 'false',
          fields: '*'
        },
        headers: {
          'x-rapidapi-key': JUDGE0_API_KEY,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
      };
      

      
      const response = await axios.request(options);
    
      result = response.data;
      status = result.status.description;

      if (status === "In Queue" || status === "Processing") {
        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Step 4: Return the output to the frontend
    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status.description,
      time: result.time,
      memory: result.memory,
    });
} catch (error) {
	res.json({stderr: error.response?.data?.message || // backend error message
    error.response?.data?.error ||   // some APIs send `error`
    error.message ||                 // axios message (network error)
    "Something went wrong"})
}
  
  
  // try {


  //   const submission = await axios.post(
  //     `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
  //     {
  //       source_code: code, 
  //       language_id: languageId,
  //       stdin: stdin || "",
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-RapidAPI-Key": JUDGE0_API_KEY, 
  //         "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  //       },
  //     }
  //   );

  //   /*
  //       This call returns a "token" — like a tracking ID for this code run.
  //       Example response: { token: "e5f9d7b6-b9f9-4ff0..." }
  //       */
  //   const token = submission.data.token;

  //   // Step 3: Poll Judge0 for result using that token
  //   let result;
  //   let status = "In Queue";

  //   while (status === "In Queue" || status === "Processing") {
  //     const response = await axios.get(
  //       `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
  //       {
  //         headers: {
  //           "X-RapidAPI-Key": JUDGE0_API_KEY,
  //           "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  //         },
  //       }
  //     );
  //     result = response.data;
  //     status = result.status.description;

  //     if (status === "In Queue" || status === "Processing") {
  //       // Wait a bit before checking again
  //       await new Promise((resolve) => setTimeout(resolve, 2000));
  //     }
  //   }

  //   // Step 4: Return the output to the frontend
  //   res.json({
  //     stdout: result.stdout,
  //     stderr: result.stderr,
  //     compile_output: result.compile_output,
  //     status: result.status.description,
  //     time: result.time,
  //     memory: result.memory,
  //   });
  // } catch (error) {
  //   console.error("Error running code:", error.message);
  //   res.status(500).json({ error: "Failed to execute code" });
  // }
});


export default runCodeRouter;