package com.billsplit.backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Disabled in CI/CD pipeline without live database connectivity")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
