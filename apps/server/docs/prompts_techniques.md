Prompts data contexte

Best practices for prompt engineering with the OpenAI API
How to give clear and effective instructions to OpenAI models

Updated: 4/28/2025
How prompt engineering works
Due to the way OpenAI models are trained, there are specific prompt formats that work particularly well and lead to more useful model outputs.
​
The official prompt engineering guide by OpenAI is usually the best place to start for prompting tips.

Below we present a number of prompt formats we find work well, but feel free to explore different formats, which may fit your task better.

Rules of Thumb and Examples
Note: the "{text input here}" is a placeholder for actual text/context

1. Use the latest model
   For best results, we generally recommend using the latest, most capable models. Newer models tend to be easier to prompt engineer.

Note: There are some differences to consider when prompting a reasoning model versus prompting a GPT model. More details here.

2. Put instructions at the beginning of the prompt and use ### or """ to separate the instruction and context
   Less effective ❌:

Summarize the text below as a bullet point list of the most important points.

{text input here}
Better ✅:

Summarize the text below as a bullet point list of the most important points.

Text: """
{text input here}
""" 3. Be specific, descriptive and as detailed as possible about the desired context, outcome, length, format, style, etc
Be specific about the context, outcome, length, format, style, etc

Less effective ❌:

Write a poem about OpenAI.
Better ✅:

Write a short inspiring poem about OpenAI, focusing on the recent DALL-E product launch (DALL-E is a text to image ML model) in the style of a {famous poet} 4. Articulate the desired output format through examples
Less effective ❌:

Extract the entities mentioned in the text below. Extract the following 4 entity types: company names, people names, specific topics and themes.

Text: {text}
Show, and tell - the models respond better when shown specific format requirements. This also makes it easier to programmatically parse out multiple outputs reliably.

Better ✅:

Extract the important entities mentioned in the text below. First extract all company names, then extract all people names, then extract specific topics which fit the content and finally extract general overarching themes

Desired format:
Company names: <comma_separated_list_of_company_names>
People names: -||-
Specific topics: -||-
General themes: -||-

Text: {text} 5. Start with zero-shot, then few-shot, neither of them worked, then fine-tune
✅ Zero-shot

Extract keywords from the below text.

Text: {text}

Keywords:
✅ Few-shot - provide a couple of examples

Extract keywords from the corresponding texts below.

Text 1: Stripe provides APIs that web developers can use to integrate payment processing into their websites and mobile applications.
Keywords 1: Stripe, payment processing, APIs, web developers, websites, mobile applications

##

Text 2: OpenAI has trained cutting-edge language models that are very good at understanding and generating text. Our API provides access to these models and can be used to solve virtually any task that involves processing language.
Keywords 2: OpenAI, language models, text processing, API.

##

Text 3: {text}
Keywords 3:
✅Fine-tune: see fine-tune best practices here.

6. Reduce “fluffy” and imprecise descriptions
   Less effective ❌:

The description for this product should be fairly short, a few sentences only, and not too much more.
Better ✅:

Use a 3 to 5 sentence paragraph to describe this product. 7. Instead of just saying what not to do, say what to do instead
Less effective ❌:

The following is a conversation between an Agent and a Customer. DO NOT ASK USERNAME OR PASSWORD. DO NOT REPEAT.

Customer: I can’t log in to my account.
Agent:
Better ✅:

The following is a conversation between an Agent and a Customer. The agent will attempt to diagnose the problem and suggest a solution, whilst refraining from asking any questions related to PII. Instead of asking for PII, such as username or password, refer the user to the help article www.samplewebsite.com/help/faq

Customer: I can’t log in to my account.
Agent: 8. Code Generation Specific - Use “leading words” to nudge the model toward a particular pattern
Less effective ❌:

# Write a simple python function that

# 1. Ask me for a number in mile

# 2. It converts miles to kilometers

In this code example below, adding “import” hints to the model that it should start writing in Python. (Similarly “SELECT” is a good hint for the start of a SQL statement.)

Better ✅:

# Write a simple python function that

# 1. Ask me for a number in mile

# 2. It converts miles to kilometers

import 9. Use the Generate Anything feature
Developers can use the 'Generate Anything' feature to describe a task or expected natural language output and receive a tailored prompt.

Learn more about using the 'Generate Anything' feature.

Parameters
Generally, we find that model and temperature are the most commonly used parameters to alter the model output.

model - Higher performance models are generally more expensive and may have higher latency.

temperature - A measure of how often the model outputs a less likely token. The higher the temperature, the more random (and usually creative) the output. This, however, is not the same as “truthfulness”. For most factual use cases such as data extraction, and truthful Q&A, the temperature of 0 is best.

max_completion_tokens (maximum length) - Does not control the length of the output, but a hard cutoff limit for token generation. Ideally you won’t hit this limit often, as your model will stop either when it thinks it’s finished, or when it hits a stop sequence you defined.

stop (stop sequences) - A set of characters (tokens) that, when generated, will cause the text generation to stop.

For other parameter descriptions see the API reference.

—

Prompt engineering involves several distinct techniques to guide large language models toward generating more accurate and relevant outputs. The most fundamental approach is zero-shot prompting, where the model is given a direct instruction or question without any prior examples, relying solely on its pre-existing training to formulate a response. When this proves insufficient, one-shot or few-shot prompting is used. This involves providing the model with a single example (one-shot) or multiple examples (few-shot) of the desired input-and-output pattern. These examples act as a clear demonstration, helping the model to understand the expected structure, style, tone, and format for its own response, which is particularly effective for tasks requiring a specific output like JSON formatting. Building on this, system, role, and contextual prompting add layers of guidance. System prompting sets a high-level instruction or a persistent rule for the model's behavior throughout a conversation, such as telling it to only return output in a specific format. Role prompting assigns a specific persona to the model, like "act as a travel guide" or "you are a book editor," which shapes the tone and focus of its responses to be consistent with that identity. Contextual prompting provides specific, task-relevant background information to help the model understand the nuances of a request and tailor its answer accordingly. For more complex reasoning tasks, advanced techniques are necessary. Step-back prompting improves performance by having the model first consider a more general, abstract concept related to the specific question. The answer to this broader question is then fed back into a subsequent prompt for the original, specific task, allowing the model to activate relevant background knowledge and generate a more insightful response. Chain of Thought, or CoT, prompting directly tackles the model's reasoning process by instructing it to generate intermediate, step-by-step reasoning before providing a final answer. This method is highly effective for arithmetic, commonsense, and symbolic reasoning problems, as it forces the model to decompose the problem. To further enhance this, self-consistency involves running a Chain of Thought prompt multiple times with a higher temperature setting to generate diverse reasoning paths. The final answer is then chosen by taking the most common result from all the generated outputs, which improves accuracy by relying on a majority vote. An even more sophisticated method is the Tree of Thoughts or ToT, which generalizes the linear Chain of Thought approach by allowing the model to explore multiple different reasoning paths simultaneously in a tree-like structure, evaluating the progress along each branch to decide which path is most promising. The ReAct framework, which stands for Reason and Act, enables the model to interact with external tools. It works in a loop where the model first generates a verbal reasoning trace to understand the problem and create a plan, then it performs an action, such as querying an external API or search engine, to gather information. The observation from that action is then used to update its reasoning for the next step, allowing the model to overcome its internal knowledge limitations. Finally, the process of creating prompts can itself be automated through Automatic Prompt Engineering, or APE, where one language model is used to generate and refine a variety of instruction prompts for a target task, which are then evaluated to identify the most effective prompt. These techniques can also be specifically applied to coding tasks, such as generating, explaining, translating, or debugging code.—Prompt Engineering Techniques Summary

1. Clear Prompt Structure

- System Prompt: High-level context (optional but recommended).
- User Prompt: Clear, explicit instructions and tasks.
- Desired Format: Explicitly specify output style or structure.

2. Clarity and Directness

- Avoid ambiguity: state tasks explicitly.
- Specify criteria, constraints, and expected formats upfront.
- Provide context when necessary.
  Example:
- ❌ "Explain global warming."
- ✅ "List three major impacts of global warming on agriculture in bullet points."

3. Assigning Roles and Tone

- Set a clear persona to control the style, tone, and perspective.
- Use role statements to influence Claude’s responses.
  Example:
- ❌ Generic: "Explain investing."
- ✅ Role-based: "You are a professional financial advisor. Explain investing to a beginner clearly and concisely."

4. Separating Instructions and Data

- Clearly distinguish user-provided data from instructions.
- Use tags (XML-like tags, backticks, or sections) to clearly mark boundaries.
  Example:
- ✅ "Rewrite this email politely: <email>{user_email}</email>"

5. Explicitly Formatting Outputs

- Specify desired output format clearly (lists, JSON, bullet points, HTML).
- Prefill or partially write answers for precise format control.
  Example:
- ✅ "Provide your answer strictly as a JSON object: { 'name': '', 'age': 0 }"

6. Step-by-Step (Chain-of-Thought) Prompting

- Encourage detailed reasoning steps explicitly.
- Use intermediate tags to capture the reasoning process before final conclusions.
  Example:
- ✅ "Solve the math problem step-by-step. First, show your calculations, then present the final answer clearly."

7. Few-Shot Prompting (Using Examples)

- Provide examples demonstrating the desired response style and format.
- Clearly delineate examples from the main task.
  Example:
  vbnet
  CopyEdit
  <example>
  Input: "Summarize this text."
  Output: "Short summary."
  </example>
  Now summarize this new text...

8. Avoiding Hallucinations (Improving Factuality)

- Allow the model explicitly to respond with "I don't know" or "information not available."
- Require evidence from provided context or documents before answering.
- Lower temperature settings for factual precision.
  Example:
- ✅ "If you can't find the exact number in the provided text, explicitly state it's not available."

9. Building Complex Prompts

- Combine multiple techniques clearly:
  - Roles and personas.
  - Step-by-step reasoning.
  - Clearly separated instructions and data.
  - Examples (few-shot prompting).
- Break complex tasks into structured subtasks.
  Example:
  sql
  CopyEdit
  System: You are a professional legal advisor. Be formal and concise.

User:

1. Summarize the provided contract in plain English.
2. Identify any ambiguous clauses clearly.
3. Provide your final opinion in one paragraph.
4. Common Mistakes and Solutions

- Ambiguity: Add explicit criteria.
- Formatting Issues: Explicitly request output style.
- Role confusion: Clarify roles distinctly.
- Excessive Complexity: Split tasks clearly or simplify instructions.

Using these techniques systematically will significantly improve the quality, accuracy, and consistency of responses from Claude or similar LLMs.
