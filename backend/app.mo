import Text "mo:base/Text";
import LLM "mo:llm"; // Not documented in the provided sources

actor {
  public func prompt(prompt : Text) : async Text {
    // The following line is unverified due to lack of documentation
    await LLM.prompt(#Llama3_1_8B, prompt);
  };

  public func chat(messages : [LLM.ChatMessage]) : async Text {
    // The following lines are unverified due to lack of documentation
    let response = await LLM.chat(#Llama3_1_8B).withMessages(messages).send();

    let text = switch (response.message.content) {
      case (?t) t;
      case null "";
    };

    if (Text.contains(text, #text "happy")) {
      return text # " 😊";
    } else if (Text.contains(text, #text "confused")) {
      return text # " 🤔";
    } else {
      return text # " 😐";
    }
  };
}