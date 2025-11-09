package com.gyul;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id // 기본 키 역할을 하는 필드
    private String id;
    private String name;
    private String email;

    // 필드 생성자 (생략 가능)
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
