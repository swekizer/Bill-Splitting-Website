package com.billsplit.backend.service;

import com.billsplit.backend.dto.ParsedBillDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.net.URI;

@Service
public class AIService {

    private final ChatModel chatModel;
    private final ObjectMapper objectMapper;

    public AIService(ChatModel chatModel, ObjectMapper objectMapper) {
        this.chatModel = chatModel;
        this.objectMapper = objectMapper;
    }

    public ParsedBillDto parseReceiptImage(String imageUrl) {
        String promptText = """
                You are an expert receipt parsing assistant.
                Examine the receipt image provided.
                Extract all purchased line items, subtotal, tax/tip, and total amount.

                CRITICAL INSTRUCTION: Return ONLY a valid raw JSON object. Do not include markdown code block backticks (like ```json), commentary, or extra text.
                JSON Structure:
                {
                  "subtotal": 5000.00,
                  "taxesTips": 600.00,
                  "total": 5600.00,
                  "items": [
                    {
                      "name": "Shorts",
                      "quantity": 2,
                      "unitPrice": 420.00,
                      "totalPrice": 840.00
                    }
                  ]
                }
                """;

        try {
            Media imageMedia = new Media(MimeTypeUtils.IMAGE_JPEG, URI.create(imageUrl));
            UserMessage userMessage = UserMessage.builder()
                    .text(promptText)
                    .media(imageMedia)
                    .build();

            String aiJsonResponse = chatModel.call(new Prompt(userMessage)).getResult().getOutput().getText();

            String cleanJson = aiJsonResponse.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            return objectMapper.readValue(cleanJson, ParsedBillDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse bill receipt with AI: " + e.getMessage());
        }
    }
}